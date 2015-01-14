define(["lodash", "moment", "dhisId", "properties"], function(_, moment, dhisId, properties) {
    return function($scope, $q, $hustle, $modal, $timeout, $location, $anchorScroll, db, programRepository, programEventRepository, dataElementRepository, systemSettingRepository) {
        var resetForm = function() {
            $scope.numberPattern = "^[1-9][0-9]*$";
            $scope.showForm = false;
            $scope.showView = false;
            $scope.dataValues = {};
            $scope.eventDates = {};
            $scope.minDateInCurrentPeriod = $scope.week.startOfWeek;
            $scope.maxDateInCurrentPeriod = $scope.week.endOfWeek;
            if ($scope.form.eventDataEntryForm !== undefined)
                $scope.form.eventDataEntryForm.$setPristine();
        };

        var loadPrograms = function() {
            var getProgramAndStagesPromises = [];
            _.each($scope.programsInCurrentModule, function(programId) {
                getProgramAndStagesPromises.push(programRepository.getProgramAndStages(programId));
            });

            return $q.all(getProgramAndStagesPromises).then(function(allPrograms) {
                $scope.programs = allPrograms;
                return $scope.programs;
            });
        };

        var loadOptionSets = function() {
            var store = db.objectStore("optionSets");
            return store.getAll().then(function(opSets) {
                $scope.optionSets = opSets;
                return;
            });
        };

        var setExcludedPropertyForDataElements = function(programs) {
            var loadSystemSettings = function() {
                return systemSettingRepository.getAllWithProjectId($scope.currentModule.parent.id).then(function(data) {
                    if (data === undefined) return [];
                    var excludedDataElementIds = data.value.excludedDataElements[$scope.currentModule.id];
                    return excludedDataElementIds;
                });
            };

            var setDataElements = function(excludedDataElementIds) {
                _.forEach(programs, function(program) {
                    _.forEach(program.programStages, function(programStage) {
                        _.forEach(programStage.programStageSections, function(section) {
                            _.forEach(section.programStageDataElements, function(psde) {
                                psde.dataElement.isExcluded = (_.indexOf(excludedDataElementIds, psde.dataElement.id) !== -1) ? true : false;
                            });
                        });
                    });
                });
                return programs;
            };
            return loadSystemSettings().then(setDataElements);
        };

        var reloadEventsView = function() {
            var period = moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]W");
            var programIdsInCurrentModule = $scope.programsInCurrentModule;
            $scope.allEvents = [];
            return _.forEach(programIdsInCurrentModule, function(programId) {
                programEventRepository.getEventsFor(programId, period, $scope.currentModule.id).then(function(events) {
                    $scope.allEvents = $scope.allEvents.concat(events);
                });
            });
        };

        var showModal = function(okCallback, message) {
            $scope.modalMessage = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm.dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });
            modalInstance.result.then(okCallback);
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

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        $scope.openNewForm = function() {
            resetForm();
            $scope.showForm = true;
        };

        $scope.closeNewForm = function() {
            resetForm();
            $scope.showView = true;
        };

        $scope.isCurrentWeekSelected = function(week) {
            var today = moment().format("YYYY-MM-DD");
            if (week && today >= week.startOfWeek && today <= week.endOfWeek)
                return true;
            return false;
        };

        var hideMessage = function() {
            $scope.resultMessageType = "";
            $scope.resultMessage = "";
        };

        $scope.save = function(program, programStage, addAnother) {

            var showResultMessage = function() {
                $scope.resultMessageType = "success";
                $scope.resultMessage = $scope.resourceBundle.eventSaveSuccess;
                scrollToTop();

                $timeout(hideMessage, properties.messageTimeout);
            };

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
                    'localStatus': "DRAFT"
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

            return programEventRepository.upsert(newEventsPayload)
                .then(function() {
                    showResultMessage();
                    reloadEventsView();
                    if (addAnother)
                        $scope.openNewForm();
                    else
                        $scope.closeNewForm();
                });
        };

        $scope.update = function(programStage) {

            var showResultMessage = function() {
                $scope.resultMessageType = "success";
                $scope.resultMessage = $scope.resourceBundle.eventSaveSuccess;
                scrollToTop();

                $timeout(hideMessage, properties.messageTimeout);
            };

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
                    'localStatus': "DRAFT"
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

            return programEventRepository.upsert(newEventsPayload)
                .then(function() {
                    showResultMessage();
                    reloadEventsView();
                    $scope.showView = true;
                    $scope.includeEditForm = false;
                });
        };

        $scope.submit = function(programId) {
            var saveToDhis = function() {
                return $hustle.publish({
                    "type": "uploadProgramEvents"
                }, "dataValues");
            };

            var showResultMessage = function() {
                $scope.resultMessageType = "success";
                $scope.resultMessage = $scope.resourceBundle.eventSubmitSuccess;
                scrollToTop();
                reloadEventsView();

                $timeout(hideMessage, properties.messageTimeout);
            };

            var period = moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]W");
            var currentModule = $scope.currentModule.id;

            return programEventRepository.markEventsAsSubmitted(programId, period, currentModule)
                .then(saveToDhis)
                .then(showResultMessage);
        };

        $scope.deleteEvent = function(event) {

            var saveToDhis = function(data) {
                return $hustle.publish({
                    "data": data,
                    "type": "deleteEvent"
                }, "dataValues");
            };

            var deleteOnConfirm = function() {
                var eventId = event.event;

                var hardDelete = function() {
                    return programEventRepository.delete(eventId);
                };

                var softDelete = function() {
                    event.localStatus = "DELETED";
                    var eventsPayload = {
                        'events': [event]
                    };
                    return programEventRepository.upsert(eventsPayload).then(function() {
                        return saveToDhis(eventId);
                    });
                };

                var deleteFunction = event.localStatus === "DRAFT" ? hardDelete : softDelete;

                return deleteFunction.apply().then(function() {
                    $scope.allEvents.splice(_.indexOf($scope.allEvents, event), 1);
                    $scope.deleteSuccess = true;
                    $timeout(function() {
                        $scope.deleteSuccess = false;
                    }, properties.messageTimeout);
                });
            };

            showModal(deleteOnConfirm, $scope.resourceBundle.deleteEventConfirmation);
        };

        $scope.setUpViewOrEditForm = function(eventId) {
            var getAllEvents = function() {
                return programEventRepository.getAll();
            };

            var setUpEvent = function(eventData) {
                var getProgramInfoNgModel = function(programId) {
                    return programRepository.getProgramAndStages(programId);
                };

                var eventToBeEdited = _.find(eventData, {
                    'event': eventId
                });

                return getProgramInfoNgModel(eventToBeEdited.program).then(function(program) {
                    eventToBeEdited.eventDate = new Date(eventToBeEdited.eventDate);
                    setExcludedPropertyForDataElements([program]).then(function(modifiedPrograms) {
                        eventToBeEdited.program = modifiedPrograms[0];
                        eventToBeEdited.dataElementValues = getDataElementValues(eventToBeEdited);
                        $scope.eventToBeEdited = _.cloneDeep(eventToBeEdited);
                        return;
                    });

                });
            };
            $scope.showView = false;
            $scope.includeEditForm = true;
            $scope.formTemplateUrl = "templates/partials/edit-event.html" + '?' + moment().format("X");
            return loadOptionSets().then(getAllEvents).then(setUpEvent);
        };

        $scope.closeEditForm = function() {
            $scope.showView = true;
            $scope.includeEditForm = false;
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

        $scope.$watch('eventDataEntryForm', function(eventDataEntryForm) {
            if (eventDataEntryForm) {
                $scope.eventDataEntryForm.$setPristine();
            }
        });

        var init = function() {
            var setUpNewForm = function() {
                $scope.form = {};
                $scope.loading = true;
                resetForm();
                $scope.showView = true;
                reloadEventsView();
                loadPrograms()
                    .then(setExcludedPropertyForDataElements)
                    .then(loadOptionSets);
                $scope.loading = false;
                $scope.includeEditForm = false;
            };

            setUpNewForm();

        };

        init();
    };
});
