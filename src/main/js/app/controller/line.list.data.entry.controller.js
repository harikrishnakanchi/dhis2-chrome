define(["lodash", "moment", "dhisId"], function(_, moment, dhisId) {
    return function($scope, $q, $hustle, db, programRepository, programEventRepository, dataElementRepository) {


        var resetForm = function() {
            $scope.dataValues = {};
            $scope.eventDates = {};
            $scope.minDateInCurrentPeriod = $scope.week.startOfWeek;
            $scope.maxDateInCurrentPeriod = $scope.week.endOfWeek;
            getAllEvents();
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

        var buildPayloadFromView = function() {
            var newEvents = [];
            _.each($scope.programs, function(p) {
                _.each(p.programStages, function(ps) {
                    var event = {
                        'event': dhisId.get(p.id + ps.id + $scope.currentModule.id + moment().format()),
                        'program': p.id,
                        'programStage': ps.id,
                        'orgUnit': $scope.currentModule.id,
                        'eventDate': moment($scope.eventDates[p.id][ps.id]).format("YYYY-MM-DD"),
                        'dataValues': [],
                        'localStatus': "NEW"
                    };
                    _.each(ps.programStageDataElements, function(psde) {
                        event.dataValues.push({
                            "dataElement": psde.dataElement.id,
                            "value": $scope.dataValues[p.id][ps.id][psde.dataElement.id]
                        });
                    });
                    newEvents.push(event);
                });
            });
            return {
                'events': newEvents
            };
        };

        var getAllEvents = function() {
            var period = $scope.year + "W" + $scope.week.weekNumber;
            return $q.all([programEventRepository.getEventsForPeriodAndOrgUnit(period, $scope.currentModule.id), dataElementRepository.getAll()]).then(function(data) {
                var events = data[0];
                var dataElements = data[1];

                var enrichDataElement = function(dataElement) {
                    var attr = _.find(dataElement.attributeValues, {
                        "attribute": {
                            "code": 'showInEventSummary'
                        }
                    });
                    if ((!_.isEmpty(attr)) && attr.value === true) {
                        dataElement.showInEventSummary = true;
                    } else {
                        dataElement.showInEventSummary = false;
                    }
                    return dataElement;
                };

                var enrichEvents = function(events) {
                    return _.map(events, function(event) {
                        var dataValues = event.dataValues;
                        _.forEach(dataValues, function(dataValue) {
                            _.forEach(enrichedDataElements, function(de) {
                                if (de.id === dataValue.dataElement) {
                                    dataValue.showInEventSummary = de.showInEventSummary;
                                }
                            });
                        });
                        return event;
                    });
                };

                var enrichedDataElements = _.map(dataElements, function(dataElement) {
                    return enrichDataElement(dataElement);
                });

                $scope.allEvents = enrichEvents(events);
                return data;
            });

        };

        $scope.getEventDateNgModel = function(eventDates, programId, programStageId) {
            eventDates[programId] = eventDates[programId] || {};
            eventDates[programId][programStageId] = eventDates[programId][programStageId] || new Date();
            return eventDates[programId];
        };

        $scope.getDataValueNgModel = function(dataValues, programId, programStageId) {
            dataValues[programId] = dataValues[programId] || {};
            dataValues[programId][programStageId] = dataValues[programId][programStageId] || {};
            return dataValues[programId][programStageId];
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

        var saveToDhis = function(data) {
            $scope.resultMessageType = "success";
            $scope.resultMessage = $scope.resourceBundle.eventSubmitSuccess;
            return $hustle.publish({
                "data": data,
                "type": "uploadProgramEvents"
            }, "dataValues");
        };

        $scope.submit = function(isDraft) {
            var newEventsPayload = buildPayloadFromView();
            return programEventRepository.upsert(newEventsPayload).then(function(payload) {
                $scope.resultMessageType = "success";
                $scope.resultMessage = $scope.resourceBundle.eventSaveSuccess;
                if (isDraft)
                    return payload;
                return saveToDhis(payload).then(function(data) {
                    getAllEvents();
                });
            });
        };

        var init = function() {
            $scope.loading = true;
            resetForm();
            loadPrograms().then(loadOptionSets);
            $scope.loading = false;
        };

        init();
    };
});