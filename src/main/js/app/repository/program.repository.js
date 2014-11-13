define(["lodash"], function(_) {
    return function(db, $q) {
        this.getProgramsForOrgUnit = function(orgUnit) {
            var store = db.objectStore("programs");
            var query = db.queryBuilder().$eq(orgUnit).$index("by_organisationUnit").compile();
            return store.each(query);
        };

        this.upsert = function(payload) {
            var store = db.objectStore("programs");
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        this.getProgramAndStages = function(programId) {
            var getProgram = function(programId) {
                var programsStore = db.objectStore("programs");
                return programsStore.find(programId);
            };

            var enrichProgramStages = function(program) {
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
                var dataElementsStore = db.objectStore("dataElements");
                var promises = [];
                _.each(program.programStages, function(s) {
                    _.each(s.programStageDataElements, function(sde) {
                        promises.push(dataElementsStore.find(sde.dataElement.id).then(function(de) {
                            sde.dataElement = de;
                        }));
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