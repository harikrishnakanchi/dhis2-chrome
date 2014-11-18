define(["lodash", "moment", "dhisId"], function(_, moment, dhisId) {
    return function($scope, $q, $hustle, db, programRepository, programEventRepository) {

        var resetForm = function() {
            $scope.dataValues = {};
            $scope.eventDates = {};
            $scope.minDateInCurrentPeriod = $scope.week.startOfWeek;
            $scope.maxDateInCurrentPeriod = $scope.week.endOfWeek;
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
                        'dataValues': []
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
            // return $hustle.publish({
            //     "data": data,
            //     "type": "uploadProgramEvents"
            // }, "dataValues");
        };

        $scope.submit = function(isDraft) {
            var newEventsPayload = buildPayloadFromView();
            programEventRepository.upsert(newEventsPayload).then(function(payload) {
                $scope.resultMessageType = "success";
                $scope.resultMessage = $scope.resourceBundle.eventSaveSuccess;
                if (isDraft)
                    return payload;
                return saveToDhis(payload);
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