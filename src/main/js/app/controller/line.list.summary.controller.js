define(["lodash", "moment", "properties", "orgUnitMapper"], function(_, moment, properties, orgUnitMapper) {
    return function($scope, $q, $hustle, $modal, $timeout, $location, $anchorScroll, $routeParams, programRepository, programEventRepository, systemSettingRepository,
        orgUnitRepository, approvalDataRepository) {

        $scope.filterParams = {};

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var confirmAndProceed = function(okCallback, message, showModal) {
            if (showModal === false)
                return $q.when(okCallback());

            $scope.modalMessages = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            return modalInstance.result
                .then(function() {
                    return okCallback();
                }, function() {
                    //burp on cancel
                });
        };

        var showResultMessage = function(messageType, message) {
            var hideMessage = function() {
                $scope.resultMessageType = "";
                $scope.resultMessage = "";
            };

            $scope.resultMessageType = messageType;
            $scope.resultMessage = message;
            $timeout(hideMessage, properties.messageTimeout);
            scrollToTop();
        };


        var loadEventsView = function() {
            $scope.eventForm = {
                allEvents: []
            };

            if ($scope.filterBy === "incomplete") {
                $scope.eventListTitle = $scope.resourceBundle.incompleteEventsTitle;
                $scope.noCasesMsg = $scope.resourceBundle.noIncompleteEventsFound;

                return programEventRepository.getDraftEventsFor($scope.program.id, _.pluck($scope.originOrgUnits, "id")).then(function(data) {
                    $scope.events = data;
                });
            }
            if ($scope.filterBy === "readyToSubmit") {
                $scope.eventListTitle = $scope.resourceBundle.readyToSubmitEventsTitle;
                $scope.noCasesMsg = $scope.resourceBundle.noReadyToSubmitEventsFound;
                return programEventRepository.getSubmitableEventsFor($scope.program.id, _.pluck($scope.originOrgUnits, "id")).then(function(data) {
                    $scope.events = data;
                });
            }
            if ($scope.filterBy === "dateRange") {
                var startDate = $location.search().startDate;
                var endDate = $location.search().endDate;
                $scope.filterBy = $scope.filterByOptions[1].id;
                $scope.filterParams.startDate = moment(startDate).toDate();
                $scope.filterParams.endDate = moment(endDate).toDate();

                return programEventRepository.findEventsByDateRange($scope.program.id, _.pluck($scope.originOrgUnits, "id"), startDate, endDate).then(function(events) {
                    $scope.events = events;
                });
            }

            if ($scope.filterBy === "caseNumber") {
                $scope.filterBy = $scope.filterByOptions[0].id;
                $scope.filterParams.caseNumber = "";
                $scope.events = undefined;
            }

        };

        var getSubmitableEvents = function() {
            return _.filter($scope.events, function(event) {
                return event.localStatus === "NEW_DRAFT" || event.localStatus === "UPDATED_DRAFT";
            });
        };

        var getPeriodsAndOrgUnits = function(events) {
            var periods = _.uniq(_.pluck(events, "period"));
            return _.map(periods, function(period) {
                return {
                    "period": period,
                    "orgUnit": $scope.selectedModuleId
                };
            });
        };

        $scope.showPatientOriginInSummaryTable = function() {
            return $scope.program.name === "Burn Unit" || $scope.program.name === "Cholera Treatment Centre";
        };

        $scope.getDisplayValue = function(dataValue) {
            if (!dataValue.value) return "";
            if (dataValue.optionSet && dataValue.optionSet.options.length > 0) {
                return _.find(dataValue.optionSet.options, function(o) {
                    return o.code === dataValue.value;
                }).name;
            } else {
                return dataValue.value;
            }
        };

        $scope.getFormattedDate = function(date) {
            return date ? moment(date).toDate().toLocaleDateString() : "";
        };

        $scope.submit = function() {

            var submitableEvents = getSubmitableEvents();
            var periodsAndOrgUnits = getPeriodsAndOrgUnits(submitableEvents);

            var clearAnyExisingApprovals = function() {
                return approvalDataRepository.clearApprovals(periodsAndOrgUnits);
            };

            var publishToDhis = function() {
                var uploadEventsPromise = $hustle.publish({
                    "type": "uploadProgramEvents",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadProgramEventsDesc + _.pluck(periodsAndOrgUnits, "period") + ", Module: " + $scope.selectedModuleName
                }, "dataValues");

                var deleteApprovalsPromise = $hustle.publish({
                    "data": periodsAndOrgUnits,
                    "type": "deleteApprovals",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.deleteApprovalsDesc + _.pluck(periodsAndOrgUnits, "period") + ", Module: " + $scope.selectedModuleName
                }, "dataValues");

                return $q.all([uploadEventsPromise, deleteApprovalsPromise]);
            };

            var updateView = function() {
                showResultMessage("success", submitableEvents.length + $scope.resourceBundle.eventSubmitSuccess);
                loadEventsView();
            };

            programEventRepository.markEventsAsSubmitted(_.pluck(submitableEvents, 'event'))
                .then(clearAnyExisingApprovals)
                .then(publishToDhis)
                .then(updateView);
        };

        $scope.submitAndApprove = function() {

            var submitableEvents = getSubmitableEvents();
            var periodsAndOrgUnits = getPeriodsAndOrgUnits(submitableEvents);

            var clearAnyExisingApprovals = function() {
                return approvalDataRepository.clearApprovals(periodsAndOrgUnits);
            };

            var markAsApproved = function() {
                var completedAndApprovedBy = $scope.currentUser.userCredentials.username;
                return approvalDataRepository.markAsApproved(periodsAndOrgUnits, completedAndApprovedBy);
            };

            var publishToDhis = function() {
                var uploadProgramPromise = $hustle.publish({
                    "type": "uploadProgramEvents",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadProgramEventsDesc + _.pluck(periodsAndOrgUnits, "period") + ", Module: " + $scope.selectedModuleName
                }, "dataValues");

                var uploadCompletionPromise = $hustle.publish({
                    "data": periodsAndOrgUnits,
                    "type": "uploadCompletionData",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadCompletionDataDesc + _.pluck(periodsAndOrgUnits, "period") + ", Module: " + $scope.selectedModuleName
                }, "dataValues");

                var uploadApprovalPromise = $hustle.publish({
                    "data": periodsAndOrgUnits,
                    "type": "uploadApprovalData",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadApprovalDataDesc + _.pluck(periodsAndOrgUnits, "period") + ", Module: " + $scope.selectedModuleName
                }, "dataValues");

                return $q.all([uploadProgramPromise, uploadCompletionPromise, uploadApprovalPromise]);
            };

            var updateView = function() {
                showResultMessage("success", submitableEvents.length + $scope.resourceBundle.eventSubmitAndApproveSuccess);
                loadEventsView();
            };

            programEventRepository.markEventsAsSubmitted(_.pluck(submitableEvents, 'event'))
                .then(clearAnyExisingApprovals)
                .then(markAsApproved)
                .then(publishToDhis)
                .then(updateView);
        };

        $scope.deleteEvent = function(ev) {
            var eventId = ev.event;

            var periodAndOrgUnit = {
                "period": ev.period,
                "orgUnit": $scope.selectedModuleId
            };

            var clearAnyExisingApprovals = function() {
                return approvalDataRepository.clearApprovals(periodAndOrgUnit);
            };

            var publishToDhis = function() {
                var deleteEventPromise = $hustle.publish({
                    "data": eventId,
                    "type": "deleteEvent",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.deleteEventDesc
                }, "dataValues");

                var deleteApprovalsPromise = $hustle.publish({
                    "data": periodAndOrgUnit,
                    "type": "deleteApprovals",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.deleteApprovalsDesc + periodAndOrgUnit.period + ", Module: " + $scope.selectedModuleName
                }, "dataValues");

                return $q.all([deleteEventPromise, deleteApprovalsPromise]);
            };

            var hardDelete = function() {
                return programEventRepository.delete(eventId);
            };

            var softDelete = function() {
                ev.localStatus = "DELETED";
                return programEventRepository.upsert(ev)
                    .then(clearAnyExisingApprovals)
                    .then(publishToDhis);
            };

            var deleteOnConfirm = function() {
                var deleteFunction = ev.localStatus === "NEW_DRAFT" || ev.localStatus === "NEW_INCOMPLETE_DRAFT" ? hardDelete : softDelete;
                return deleteFunction.apply().then(function() {
                    showResultMessage("success", $scope.resourceBundle.eventDeleteSuccess);
                    loadEventsView();
                });
            };

            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.deleteEventConfirmation
            };

            confirmAndProceed(deleteOnConfirm, modalMessages);
        };

        $scope.filterByCaseNumber = function() {
            programEventRepository.findEventsByCode($scope.program.id, _.pluck($scope.originOrgUnits, "id"), $scope.filterParams.caseNumber).then(function(events) {
                $scope.events = events;
            });

        };

        $scope.filterByDateRange = function() {
            var startDate = moment($scope.filterParams.startDate).format("YYYY-MM-DD");
            var endDate = moment($scope.filterParams.endDate).format("YYYY-MM-DD");

            programEventRepository.findEventsByDateRange($scope.program.id, _.pluck($scope.originOrgUnits, "id"), startDate, endDate).then(function(events) {
                $scope.events = events;
            });

        };

        var init = function() {

            var loadModule = function() {
                return orgUnitRepository.get($routeParams.module).then(function(data) {
                    $scope.selectedModuleId = data.id;
                    $scope.selectedModuleName = data.name;
                });
            };

            var loadOriginOrgUnits = function() {
                return orgUnitRepository.findAllByParent($scope.selectedModuleId).then(function(data) {
                    $scope.originOrgUnits = data;
                });
            };

            var loadPrograms = function() {
                var getExcludedDataElementsForModule = function() {
                    return systemSettingRepository.get($scope.selectedModuleId).then(function(data) {
                        return data && data.value ? data.value.dataElements : [];
                    });
                };

                var getProgram = function(excludedDataElements) {
                    return programRepository.getProgramForOrgUnit($scope.originOrgUnits[0].id).then(function(program) {
                        return programRepository.get(program.id, excludedDataElements).then(function(program) {
                            $scope.program = program;
                        });
                    });
                };

                return getExcludedDataElementsForModule().then(getProgram);
            };

            var setUpProjectAutoApprovedFlag = function() {
                return orgUnitRepository.getParentProject($scope.selectedModuleId).then(function(orgUnit) {
                    $scope.projectIsAutoApproved = _.any(orgUnit.attributeValues, {
                        'attribute': {
                            'code': "autoApprove"
                        },
                        "value": "true"
                    });
                });
            };

            $scope.resultMessageType = $location.search().messageType;
            $scope.resultMessage = $location.search().message;
            $scope.filterByOptions = [{
                'id': 'caseNumber',
                'name': 'Case Number'
            }, {
                'id': 'dateRange',
                'name': 'Date Range'
            }];

            $scope.filterBy = $routeParams.filterBy;
            if (!$scope.filterBy)
                $scope.filterBy = 'caseNumber';
            $scope.eventListTitle = $scope.resourceBundle.eventListTitle;
            $scope.noCasesMsg = $scope.resourceBundle.noCasesFound;
            $scope.loading = true;
            return loadModule()
                .then(loadOriginOrgUnits)
                .then(loadPrograms)
                .then(setUpProjectAutoApprovedFlag)
                .then(loadEventsView)
                .finally(function() {
                    $scope.loading = false;
                });
        };

        init();
    };
});
