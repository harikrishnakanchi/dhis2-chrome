define(["lodash", "moment", "properties", "orgUnitMapper"], function(_, moment, properties, orgUnitMapper) {
    return function($scope, $q, $hustle, $modal, $window, $timeout, $location, $anchorScroll, $routeParams, programRepository, programEventRepository, systemSettingRepository,
        orgUnitRepository, approvalDataRepository, referralLocationsRepository) {

        $scope.filterParams = {};
        $scope.currentUrl = $location.path();
        $scope.loadingResults = false;
        $scope.showOfflineSummaryForViewOnly = true;
        $scope.viewRegistrationBook = false;

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
                $scope.filterParams.startDate = moment(startDate).startOf('day').toDate();
                $scope.filterParams.endDate = moment(endDate).endOf('day').toDate();

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

        $scope.back = function() {
            $scope.viewRegistrationBook = false;
        };

        $scope.printWindow = function() {
            $scope.printingTallySheet = true;
            $timeout(function() {
                $window.print();
            }, 0);
        };

        $scope.showRegistrationBook = function() {
            $scope.viewRegistrationBook = true;
        };

        $scope.showPatientOriginInSummaryTable = function() {
            return $scope.program.name === "Burn Unit" || $scope.program.name === "Cholera Treatment Centre";
        };

        $scope.getDisplayValue = function(dataValue) {
            if (!dataValue.value) return "";

            if (_.endsWith(dataValue.code, "_referralLocations"))
                return $scope.referralLocations[dataValue.value].name;

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
                var uploadEvents = function() {
                    return $hustle.publish({
                        "type": "uploadProgramEvents",
                        "eventIds": _.pluck(submitableEvents, 'event'),
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.uploadProgramEventsDesc + _.pluck(periodsAndOrgUnits, "period") + ", Module: " + $scope.selectedModuleName
                    }, "dataValues");
                };

                var deleteApprovals = function() {
                    return $hustle.publish({
                        "data": periodsAndOrgUnits,
                        "type": "deleteApprovals",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.deleteApprovalsDesc + _.pluck(periodsAndOrgUnits, "period") + ", Module: " + $scope.selectedModuleName
                    }, "dataValues");
                };

                return deleteApprovals()
                    .then(uploadEvents);
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

                var deleteApprovals = function() {
                    return $hustle.publish({
                        "data": periodsAndOrgUnits,
                        "type": "deleteApprovals",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.deleteApprovalsDesc + _.pluck(periodsAndOrgUnits, "period") + ", Module: " + $scope.selectedModuleName
                    }, "dataValues");
                };

                var uploadEvents = function() {
                    return $hustle.publish({
                        "type": "uploadProgramEvents",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.uploadProgramEventsDesc + _.pluck(periodsAndOrgUnits, "period") + ", Module: " + $scope.selectedModuleName
                    }, "dataValues");
                };

                var uploadCompletion = function() {
                    return $hustle.publish({
                        "data": periodsAndOrgUnits,
                        "type": "uploadCompletionData",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.uploadCompletionDataDesc + _.pluck(periodsAndOrgUnits, "period") + ", Module: " + $scope.selectedModuleName
                    }, "dataValues");
                };

                var uploadApproval = function() {
                    return $hustle.publish({
                        "data": periodsAndOrgUnits,
                        "type": "uploadApprovalData",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.uploadApprovalDataDesc + _.pluck(periodsAndOrgUnits, "period") + ", Module: " + $scope.selectedModuleName
                    }, "dataValues");
                };

                return deleteApprovals()
                    .then(uploadEvents)
                    .then(uploadCompletion)
                    .then(uploadApproval);
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
            $scope.loadingResults = true;
            programEventRepository.findEventsByCode($scope.program.id, _.pluck($scope.originOrgUnits, "id"), $scope.filterParams.caseNumber).then(function(events) {
                $scope.events = events;
                $scope.loadingResults = false;
            });

        };

        $scope.filterByDateRange = function() {
            $scope.loadingResults = true;
            var startDate = moment($scope.filterParams.startDate).format("YYYY-MM-DD");
            var endDate = moment($scope.filterParams.endDate).format("YYYY-MM-DD");

            programEventRepository.findEventsByDateRange($scope.program.id, _.pluck($scope.originOrgUnits, "id"), startDate, endDate).then(function(events) {
                $scope.events = events;
                $scope.loadingResults = false;
            });

        };

        $scope.getOriginName = function(orgUnitId) {
            return _.find($scope.originOrgUnits, {
                "id": orgUnitId
            }).name;
        };

        $scope.$on('moduleWeekInfo', function(event, data) {
            $scope.selectedModule = data[0];
            $scope.week = data[1];
            init();
        });

        var init = function() {

            var loadModule = function() {
                return orgUnitRepository.get($routeParams.module).then(function(data) {
                    $scope.selectedModuleId = data.id;
                    $scope.selectedModuleName = data.name;
                    $scope.opUnitId = data.parent.id;
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
                            $scope.associatedProgramId = program.id;
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

            var getreferralLocations = function() {
                referralLocationsRepository.get($scope.opUnitId).then(function(referralLocations) {
                    $scope.referralLocations = referralLocations;
                });
            };

            showResultMessage($location.search().messageType, $location.search().message);

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
                .then(getreferralLocations)
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
