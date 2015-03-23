define(["lodash", "moment", "dhisId", "properties", "orgUnitMapper", "groupSections", "datasetTransformer"], function(_, moment, dhisId, properties, orgUnitMapper, groupSections, datasetTransformer) {
    return function($scope, $q, $hustle, $modal, $timeout, $location, $anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepository,
        orgUnitRepository, approvalDataRepository, datasetRepository) {

        var resetForm = function() {
            $scope.numberPattern = "^[1-9][0-9]*$";
            $scope.showForm = false;
            $scope.showView = false;
            $scope.showEditForm = false;
            $scope.dataValues = {};
            $scope.eventDates = {};
            $scope.minDateInCurrentPeriod = $scope.week.startOfWeek;
            $scope.maxDateInCurrentPeriod = $scope.week.endOfWeek;
            if ($scope.form && $scope.form.eventDataEntryForm)
                $scope.form.eventDataEntryForm.$setPristine();
        };

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
                templateUrl: 'templates/confirm.dialog.html',
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

        var reloadEventsView = function() {
            $scope.allEvents = [];
            return programEventRepository.getEventsFor($scope.programId, getPeriod(), $scope.currentModule.id).then(function(events) {
                $scope.allEvents = $scope.allEvents.concat(events);
            });
        };

        $scope.getEventDateNgModel = function(eventDates, programId, programStageId) {
            eventDates[programId] = eventDates[programId] || {};
            eventDates[programId][programStageId] = eventDates[programId][programStageId] || moment($scope.minDateInCurrentPeriod).toDate();
            return eventDates[programId];
        };

        $scope.getDataValueNgModel = function(dataValues, programId, programStageId) {
            dataValues[programId] = dataValues[programId] || {};
            dataValues[programId][programStageId] = dataValues[programId][programStageId] || {};
            return dataValues[programId][programStageId];
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

        $scope.getOptionsFor = function(optionSetId) {
            var optionSet = _.find($scope.optionSets, function(os) {
                return optionSetId === os.id;
            });

            var options = optionSet ? optionSet.options : [];
            _.each(options, function(o) {
                o.displayName = $scope.resourceBundle[o.id] || o.name;
            });

            return options;
        };

        $scope.openNewForm = function() {
            resetForm();
            $scope.showForm = true;
        };

        $scope.closeNewForm = function() {
            resetForm();
            $scope.showView = true;
        };

        $scope.closeEditForm = function() {
            $scope.showView = true;
            $scope.showEditForm = false;
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

        $scope.save = function(program, programStage, addAnother) {

            var buildPayloadFromView = function() {
                var formatValue = function(value) {
                    return _.isDate(value) ? moment(value).format("YYYY-MM-DD") : value;
                };

                var newEvent = {
                    'event': dhisId.get(program.id + programStage.id + $scope.currentModule.id + moment().format()),
                    'program': program.id,
                    'programStage': programStage.id,
                    'orgUnit': $scope.currentModule.id,
                    'eventDate': moment($scope.eventDates[program.id][programStage.id]).format("YYYY-MM-DD"),
                    'dataValues': [],
                    'localStatus': "NEW_DRAFT"
                };
                _.each(programStage.programStageDataElements, function(psde) {
                    newEvent.dataValues.push({
                        "dataElement": psde.dataElement.id,
                        "value": formatValue($scope.dataValues[program.id][programStage.id][psde.dataElement.id])
                    });
                });

                return {
                    'events': [newEvent]
                };
            };

            var newEventsPayload = buildPayloadFromView();

            programEventRepository.upsert(newEventsPayload).then(function() {
                showResultMessage("success", $scope.resourceBundle.eventSaveSuccess);
                reloadEventsView();
                if (addAnother)
                    $scope.openNewForm();
                else
                    $scope.closeNewForm();
            });
        };

        $scope.getFormattedDate = function(date) {
            return moment(date).toDate().toLocaleDateString();
        };

        $scope.update = function(programStage) {

            var buildPayloadFromView = function() {
                var formatValue = function(value) {
                    return _.isDate(value) ? moment(value).format("YYYY-MM-DD") : value;
                };

                var newEvent = {
                    'event': $scope.eventToBeEdited.event,
                    'program': $scope.eventToBeEdited.program.id,
                    'programStage': $scope.eventToBeEdited.programStage,
                    'orgUnit': $scope.eventToBeEdited.orgUnit,
                    'eventDate': moment($scope.eventToBeEdited.eventDate).format("YYYY-MM-DD"),
                    'dataValues': [],
                    'localStatus': "UPDATED_DRAFT"
                };
                _.each(programStage.programStageDataElements, function(psde) {
                    newEvent.dataValues.push({
                        "dataElement": psde.dataElement.id,
                        "value": formatValue($scope.eventToBeEdited.dataElementValues[psde.dataElement.id])
                    });
                });

                return {
                    'events': [newEvent]
                };
            };

            var newEventsPayload = buildPayloadFromView();

            programEventRepository.upsert(newEventsPayload).then(function() {
                showResultMessage("success", $scope.resourceBundle.eventSaveSuccess);
                reloadEventsView();
                $scope.closeEditForm();
            });
        };

        $scope.submit = function() {
            var periodAndOrgUnit = {
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id
            };

            var markEventsAsSubmitted = function() {
                return programEventRepository.markEventsAsSubmitted($scope.programId, getPeriod(), $scope.currentModule.id);
            };

            var clearAnyExisingApprovals = function() {
                return approvalDataRepository.clearApprovals(periodAndOrgUnit);
            };

            var publishToDhis = function() {
                return $hustle.publish({
                    "type": "uploadProgramEvents"
                }, "dataValues");
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
                reloadEventsView();
            });
        };

        $scope.submitAndApprove = function() {
            var periodAndOrgUnit = {
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id
            };

            var markEventsAsSubmitted = function() {
                return programEventRepository.markEventsAsSubmitted($scope.programId, getPeriod(), $scope.currentModule.id);
            };

            var markAsAccepted = function() {
                var completedAndApprovedBy = $scope.currentUser.userCredentials.username;
                return approvalDataRepository.markAsAccepted(periodAndOrgUnit, completedAndApprovedBy);
            };

            var publishToDhis = function() {
                return $hustle.publish({
                    "type": "uploadProgramEvents"
                }, "dataValues");
            };

            var submitAndApprove = function() {
                return markEventsAsSubmitted()
                    .then(markAsAccepted)
                    .then(publishToDhis);
            };

            var confirmationQuestion = $scope.resourceBundle.reapprovalConfirmationMessage;
            var confirmIf = ($scope.isCompleted || $scope.isApproved);
            confirmAndProceed(submitAndApprove, confirmationQuestion, confirmIf).then(function() {
                showResultMessage("success", $scope.resourceBundle.eventSubmitAndApproveSuccess);
                reloadEventsView();
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
                    reloadEventsView();
                });
            };

            confirmAndProceed(deleteOnConfirm, $scope.resourceBundle.deleteEventConfirmation);
        };

        $scope.setUpViewOrEditForm = function(eventId) {
            var getEvent = function() {
                return programEventRepository.getEvent(eventId);
            };

            var getDataElementValues = function(eventToBeEdited) {
                var dataValueHash = {};

                _.forEach(eventToBeEdited.program.programStages, function(programStage) {
                    _.forEach(programStage.programStageSections, function(programStageSection) {
                        _.forEach(programStageSection.programStageDataElements, function(de) {
                            var dataElementId = de.dataElement.id;
                            var dataElementAttribute = _.find(eventToBeEdited.dataValues, {
                                "dataElement": dataElementId
                            });
                            if (!_.isEmpty(dataElementAttribute)) {
                                if (de.dataElement.type === "date") {
                                    dataValueHash[dataElementId] = new Date(dataElementAttribute.value);
                                } else if (de.dataElement.type === "int") {
                                    dataValueHash[dataElementId] = parseInt(dataElementAttribute.value);
                                } else {
                                    dataValueHash[dataElementId] = dataElementAttribute.value;
                                }
                            }
                        });
                    });
                });
                return dataValueHash;
            };

            var setUpEventInScope = function(event) {
                event.eventDate = new Date(event.eventDate);
                event.program = $scope.program;
                event.dataElementValues = getDataElementValues(event);
                $scope.eventToBeEdited = _.cloneDeep(event);
            };

            $scope.showView = false;
            $scope.showEditForm = true;
            $scope.formTemplateUrl = "templates/partials/edit-event.html" + '?' + moment().format("X");

            getEvent().then(setUpEventInScope);
        };

        $scope.$watch('eventDataEntryForm', function(eventDataEntryForm) {
            if (eventDataEntryForm) {
                $scope.eventDataEntryForm.$setPristine();
            }
        });

        var init = function() {

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

            var loadOptionSets = function() {
                var store = db.objectStore("optionSets");
                return store.getAll().then(function(opSets) {
                    $scope.optionSets = opSets;
                });
            };

            var setUpProjectAutoApprovedFlag = function() {
                return orgUnitRepository.getParentProject($scope.currentModule.id).then(function(orgUnit) {
                    var project = orgUnitMapper.mapToProject(orgUnit);
                    $scope.projectIsAutoApproved = (project.autoApprove === "true");
                });
            };

            var setUpIsApprovedFlag = function() {
                return approvalDataRepository.getApprovalData(getPeriod(), $scope.currentModule.id, true).then(function(data) {
                    $scope.isCompleted = !_.isEmpty(data) && data.isComplete;
                    $scope.isApproved = !_.isEmpty(data) && data.isApproved;
                    $scope.isAccepted = !_.isEmpty(data) && data.isAccepted;
                });
            };

            var loadAssociatedDataSets = function() {
                return datasetRepository.getAllForOrgUnit($scope.currentModule.id).then(function(dataSets) {
                    $scope.dataSetIds = _.pluck(dataSets, "id");
                });
            };

            resetForm();
            $scope.form = {};
            $scope.loading = true;
            $q.all([reloadEventsView(), loadPrograms(), loadOptionSets(), setUpProjectAutoApprovedFlag(), setUpIsApprovedFlag(), loadAssociatedDataSets()])
                .finally(function() {
                    $scope.loading = false;
                    $scope.showView = true;
                });
        };

        init();
    };
});