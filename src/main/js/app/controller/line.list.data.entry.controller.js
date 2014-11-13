define(["lodash", "moment"], function(_, moment) {
    return function($scope, $q, db, programRepository) {

        var resetForm = function() {
            $scope.dataValues = {};
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

        var buildPayload = function() {
            var newEvents = [];
            _.each($scope.programs, function(p) {
                _.each(p.programStages, function(ps) {
                    var event = {
                        'program': programId,
                        'programStage': programStageId,
                        'orgUnit': $scope.currentModule.id,
                        'eventDate': moment().format("YYYY-MM-DD"),
                        'dataValues': []
                    };
                    _.each(ps.programStageDataElements, function(psde) {
                        event.dataValues.push({
                            "dataElement": psde.dataElement.id,
                            "value": $scope.dataValues[programId][programStageId][psde.dataElement.id]
                        });
                    });
                    newEvents.push(event);
                });
            });
            return newEvents;
        };

        $scope.getNgModelFor = function(dataValues, programId, programStageId) {
            dataValues[programId] = dataValues[programId] || {};
            dataValues[programId][programStageId] = dataValues[programId][programStageId] || {};
            return dataValues[programId][programStageId];
        };

        $scope.getOptionsFor = function(optionSetId) {
            var optionSet = _.find($scope.optionSets, function(os) {
                return optionSetId === os.id;
            });
            return optionSet ? optionSet.options : [];
        };

        $scope.submit = function() {
            var newEventsPayload = buildPayload();
            console.log(JSON.stringify(newEventsPayload));
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