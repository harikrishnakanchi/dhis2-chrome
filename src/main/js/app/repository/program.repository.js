define(["lodash", "moment", "customAttributes"], function(_, moment, CustomAttributes) {
    return function(db, $q, dataElementRepository) {
        var addServiceCode = function (program) {
            if (_.isArray(program)) {
                return _.map(program, addServiceCode);
            } else {
                program.serviceCode = CustomAttributes.getAttributeValue(CustomAttributes.SERVICE_CODE);
                return program;
            }
        };

        this.getProgramForOrgUnit = function(orgUnitId) {
            var store = db.objectStore("programs");
            return store.find("by_organisationUnit", orgUnitId);
        };

        this.getAll = function() {
            var store = db.objectStore("programs");
            return store.getAll()
                .then(addServiceCode)
                .then(function(programs) {
                return _.filter(programs, function(p) {
                    return CustomAttributes.getBooleanAttributeValue(p.attributeValues, CustomAttributes.NEW_DATA_MODEL_CODE);
                });
            });
        };

        var getOrgUnitsForIndexing = function(programs) {
            return _.map(programs, function(program) {
                program.orgUnitIds = _.pluck(program.organisationUnits, 'id');
                return program;
            });
        };

        this.upsert = function(payload) {
            var programs = _.isArray(payload) ? payload : [payload];

            programs = _.map(programs, function(program) {
                program.clientLastUpdated = moment().toISOString();
                return program;
            });
            programs = getOrgUnitsForIndexing(programs);

            var store = db.objectStore("programs");
            return store.upsert(programs).then(function() {
                return programs;
            });
        };

        this.upsertDhisDownloadedData = function(payload) {
            var programs = _.isArray(payload) ? payload : [payload];
            programs = getOrgUnitsForIndexing(programs);

            var store = db.objectStore("programs");
            return store.upsert(programs).then(function() {
                return programs;
            });
        };

        this.findAll = function(programIds) {
            var store = db.objectStore("programs");

            var query = db.queryBuilder().$in(programIds).compile();
            return store.each(query).then(addServiceCode);
        };

        this.get = function(programId, excludedDataElements) {
            var getProgram = function(programId) {
                var programsStore = db.objectStore("programs");
                return programsStore.find(programId);
            };

            // This method can be removed after release > 6.0
            var addMandatoryFields = function (program) {
                program.shortName = program.shortName || program.name;
                program.programType = program.programType || "WITHOUT_REGISTRATION";
                return program;
            };

            var enrichDataElements = function(program) {
                if (!program) return undefined;
                var promises = [];
                _.each(program.programStages, function(stage) {
                    _.each(stage.programStageSections, function(section) {
                        _.each(section.programStageDataElements, function(sde) {
                            promises.push(dataElementRepository.get(sde.dataElement.id).then(function(de) {
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
                .then(addServiceCode)
                .then(enrichDataElements)
                .then(addMandatoryFields);
        };

        this.associateOrgUnits = function(program, orgUnits) {
            var addOrgUnitsToProgram = function() {
                var ouPayload = _.map(orgUnits, function(orgUnit) {
                    return {
                        "id": orgUnit.id,
                        "name": orgUnit.name
                    };
                });

                program.organisationUnits = program.organisationUnits || [];
                program.organisationUnits = program.organisationUnits.concat(ouPayload);
                return program;
            };

            var updatedProgram = addOrgUnitsToProgram();
            return this.upsert(program);
        };
    };
});