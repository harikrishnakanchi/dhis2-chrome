define(["lodash", "moment", "dhisId", "properties"], function(_, moment, dhisId, properties) {
    return function($scope, $q, $hustle, $modal, $timeout, $location, $anchorScroll, db, programRepository, programEventRepository, dataElementRepository) {
        var resetForm = function() {
            $scope.numberPattern = "^[1-9][0-9]*$";
            $scope.showForm = false;
            $scope.showView = false;
            $scope.dataValues = {};
            $scope.eventDates = {};
            $scope.minDateInCurrentPeriod = $scope.week.startOfWeek;
            $scope.maxDateInCurrentPeriod = $scope.week.endOfWeek;
            if ($scope.eventDataEntryForm !== undefined)
                $scope.eventDataEntryForm.$setPristine();
        };

        var loadPrograms = function() {
            var getProgramAndStagesPromises = [];
            _.each($scope.programsInCurrentModule, function(programId) {
                getProgramAndStagesPromises.push(programRepository.getProgramAndStages(programId));
            });

            return $q.all(getProgramAndStagesPromises).then(function(allPrograms) {
                $scope.programs = allPrograms;
            });
        };

        var loadOptionSets = function() {
            var store = db.objectStore("optionSets");
            return store.getAll().then(function(opSets) {
                $scope.optionSets = opSets;
            });
        };

        var reloadEventsView = function() {
            var period = $scope.year + "W" + $scope.week.weekNumber;
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

        $scope.save = function(program, programStage, addAnother) {

            var showResultMessage = function() {
                $scope.resultMessageType = "success";
                $scope.resultMessage = $scope.resourceBundle.eventSaveSuccess;
                scrollToTop();
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
            };

            var period = $scope.year + "W" + $scope.week.weekNumber;
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

        var init = function() {
            $scope.loading = true;
            resetForm();
            $scope.showView = true;
            reloadEventsView();
            loadPrograms().then(loadOptionSets);
            $scope.loading = false;
        };

        init();
    };
});
