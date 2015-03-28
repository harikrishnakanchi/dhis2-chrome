define(["lodash", "moment", "properties", "orgUnitMapper"], function(_, moment, properties, orgUnitMapper) {
    return function($scope, $q, $hustle, $modal, $timeout, $location, $anchorScroll, programRepository, programEventRepository, systemSettingRepository,
        orgUnitRepository, approvalDataRepository) {

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var getPeriod = function() {
            return moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]W");
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

        var confirmAndProceed = function(okCallback, message, showModal) {
            if (showModal === false)
                return $q.when(okCallback());

            $scope.modalMessage = message;
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

        var markEventsAsSubmitted = function() {
            return programEventRepository.markEventsAsSubmitted($scope.programId, getPeriod(), _.pluck($scope.originOrgUnits, "id"));
        };

        $scope.loadEventsView = function() {
            $scope.eventForm = {
                allEvents: []
            };
            $scope.eventForm.showEventForm = false;
            return programEventRepository.getEventsFor($scope.programId, getPeriod(), _.pluck($scope.originOrgUnits, "id")).then(function(events) {
                $scope.eventForm.allEvents = $scope.eventForm.allEvents.concat(events);
            });
        };

        $scope.getDisplayValue = function(dataValue) {
            if (dataValue.optionSet && dataValue.optionSet.options.length > 0) {
                return _.find(dataValue.optionSet.options, function(o) {
                    return o.code === dataValue.value;
                }).name;
            } else {
                return dataValue.value;
            }
        };

        $scope.isDataEntryAllowed = function() {
            return moment($scope.minDateInCurrentPeriod).isAfter(moment().subtract(properties.projectDataSync.numWeeksToSync, 'week'));
        };

        $scope.isCurrentWeekSelected = function(week) {
            var today = moment().format("YYYY-MM-DD");
            if (week && today >= week.startOfWeek && today <= week.endOfWeek)
                return true;
            return false;
        };

        $scope.getFormattedDate = function(date) {
            return moment(date).toDate().toLocaleDateString();
        };

        $scope.submit = function() {
            var periodAndOrgUnit = {
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id
            };

            var clearAnyExisingApprovals = function() {
                return approvalDataRepository.clearApprovals(periodAndOrgUnit);
            };

            var publishToDhis = function() {
                var uploadDataValuesPromise = $hustle.publish({
                    "type": "uploadProgramEvents"
                }, "dataValues");

                var deleteApprovalsPromise = $hustle.publish({
                    "data": periodAndOrgUnit,
                    "type": "deleteApprovals"
                }, "dataValues");

                return $q.all([uploadDataValuesPromise, deleteApprovalsPromise]);
            };

            var submit = function() {
                return markEventsAsSubmitted()
                    .then(clearAnyExisingApprovals)
                    .then(publishToDhis);
            };

            var confirmationQuestion = $scope.resourceBundle.reapprovalConfirmationMessage;
            var confirmIf = ($scope.isCompleted || $scope.isApproved);
            confirmAndProceed(submit, confirmationQuestion, confirmIf).then(function() {
                showResultMessage("success", $scope.resourceBundle.eventSubmitSuccess);
                $scope.loadEventsView();
            });
        };

        $scope.submitAndApprove = function() {
            var periodAndOrgUnit = {
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id
            };

            var markAsApproved = function() {
                var completedAndApprovedBy = $scope.currentUser.userCredentials.username;
                return approvalDataRepository.markAsApproved(periodAndOrgUnit, completedAndApprovedBy);
            };

            var publishToDhis = function() {
                var uploadProgramPromise = $hustle.publish({
                    "type": "uploadProgramEvents"
                }, "dataValues");

                var uploadCompletionPromise = $hustle.publish({
                    "data": [periodAndOrgUnit],
                    "type": "uploadCompletionData"
                }, "dataValues");

                var uploadApprovalPromise = $hustle.publish({
                    "data": [periodAndOrgUnit],
                    "type": "uploadApprovalData"
                }, "dataValues");

                return $q.all([uploadProgramPromise, uploadCompletionPromise, uploadApprovalPromise]);
            };

            var submitAndApprove = function() {
                return markEventsAsSubmitted()
                    .then(markAsApproved)
                    .then(publishToDhis);
            };

            var confirmationQuestion = $scope.resourceBundle.reapprovalConfirmationMessage;
            var confirmIf = ($scope.isCompleted || $scope.isApproved);
            confirmAndProceed(submitAndApprove, confirmationQuestion, confirmIf).then(function() {
                showResultMessage("success", $scope.resourceBundle.eventSubmitAndApproveSuccess);
                $scope.loadEventsView();
            });
        };

        $scope.deleteEvent = function(event) {
            var eventId = event.event;

            var saveToDhis = function() {
                return $hustle.publish({
                    "data": eventId,
                    "type": "deleteEvent"
                }, "dataValues");
            };

            var hardDelete = function() {
                return programEventRepository.delete(eventId);
            };

            var softDelete = function() {
                event.localStatus = "DELETED";
                var eventsPayload = {
                    'events': [event]
                };

                return programEventRepository.upsert(eventsPayload)
                    .then(saveToDhis);
            };

            var deleteOnConfirm = function() {
                var deleteFunction = event.localStatus === "NEW_DRAFT" ? hardDelete : softDelete;
                return deleteFunction.apply().then(function() {
                    showResultMessage("success", $scope.resourceBundle.eventDeleteSuccess);
                    $scope.loadEventsView();
                });
            };

            confirmAndProceed(deleteOnConfirm, $scope.resourceBundle.deleteEventConfirmation);
        };

        $scope.loadEventDataEntryForm = function(event) {
            $scope.event = event;
            $scope.formTemplateUrl = "templates/partials/line-list-data-entry.html" + '?' + moment().format("X");
            $scope.eventForm.showEventForm = true;
        };

        var init = function() {
            var periodAndOrgUnit = {
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id
            };

            var loadPrograms = function() {
                var getExcludedDataElementsForModule = function() {
                    return systemSettingRepository.get($scope.currentModule.id).then(function(data) {
                        return data && data.value ? data.value.dataElements : [];
                    });
                };

                var getProgram = function(excludedDataElements) {
                    return programRepository.get($scope.programId, excludedDataElements);
                };

                return getExcludedDataElementsForModule().then(getProgram).then(function(program) {
                    $scope.program = program;
                    return program;
                });
            };

            var setUpProjectAutoApprovedFlag = function() {
                return orgUnitRepository.getParentProject($scope.currentModule.id).then(function(orgUnit) {
                    var project = orgUnitMapper.mapToProject(orgUnit);
                    $scope.projectIsAutoApproved = (project.autoApprove === "true");
                });
            };

            var setUpIsApprovedFlag = function() {
                return approvalDataRepository.getApprovalData(periodAndOrgUnit).then(function(data) {
                    $scope.isCompleted = !_.isEmpty(data) && data.isComplete;
                    $scope.isApproved = !_.isEmpty(data) && data.isApproved;
                });
            };

            var loadOriginsOrgUnits = function() {
                return orgUnitRepository.findAllByParent($scope.currentModule.id).then(function(data) {
                    $scope.originOrgUnits = data;
                    $scope.originOrgUnitsById = _.indexBy(data, "id");
                });
            };

            $scope.minDateInCurrentPeriod = $scope.week.startOfWeek;
            $scope.maxDateInCurrentPeriod = $scope.week.endOfWeek;
            $scope.loading = true;
            $scope.formTemplateUrl = undefined;

            return loadOriginsOrgUnits().then(function() {
                return $q.all([$scope.loadEventsView(), loadPrograms(), setUpProjectAutoApprovedFlag(), setUpIsApprovedFlag()]).finally(function() {
                    $scope.loading = false;
                });
            });
        };

        init();
    };
});
