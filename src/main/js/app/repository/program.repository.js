define(["lodash"], function(_) {
    return function(db, $q) {
        this.getProgramForOrgUnit = function(orgUnitId) {
            var store = db.objectStore("programs");
            return store.find("by_organisationUnit", orgUnitId);
        };

        this.getAll = function() {
            var store = db.objectStore("programs");
            return store.getAll();
        };

        this.upsert = function(payload) {
            var programs = _.isArray(payload) ? payload : [payload];
            programs = _.transform(programs, function(acc, program) {
                if (!_.isEmpty(program.organisationUnits))
                    program.orgUnitIds = _.pluck(program.organisationUnits, 'id');
                acc.push(program);
            });

            var store = db.objectStore("programs");
            return store.upsert(programs).then(function() {
                return programs;
            });
        };

        this.get = function(programId, excludedDataElements) {
            var getProgram = function(programId) {
                var programsStore = db.objectStore("programs");
                return programsStore.find(programId);
            };

            var enrichProgramStages = function(program) {
                if (!program) return undefined;
                var programStagesStore = db.objectStore("programStages");
                var programStageGetPromises = [];
                _.each(program.programStages, function(s) {
                    programStageGetPromises.push(programStagesStore.find(s.id));
                });
                return $q.all(programStageGetPromises).then(function(programStages) {
                    program.programStages = programStages;
                    return program;
                });
            };

            var enrichDataElements = function(program) {
                if (!program) return undefined;

                var dataElementsStore = db.objectStore("dataElements");
                var promises = [];
                _.each(program.programStages, function(stage) {
                    _.each(stage.programStageSections, function(section) {
                        _.each(section.programStageDataElements, function(sde) {
                            promises.push(dataElementsStore.find(sde.dataElement.id).then(function(de) {
                                de.isIncluded = _.isEmpty(excludedDataElements) || !_.contains(excludedDataElements, de.id);
                                sde.dataElement = de;
                            }));
                        });
                    });
                });

                return $q.all(promises).then(function() {
                    return program;
                });
            };

            return getProgram(programId)
                .then(enrichProgramStages)
                .then(enrichDataElements);
        };

    };
});
