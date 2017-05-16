define(["lodash", "moment", "customAttributes"], function(_, moment, customAttributes) {
    return function(db, $q, dataElementRepository) {
        var addServiceCode = function (program) {
            if (_.isArray(program)) {
                return _.map(program, addServiceCode);
            } else {
                return _.set(program, 'serviceCode', customAttributes.getAttributeValue(_.get(program, 'attributeValues'), customAttributes.SERVICE_CODE));
            }
        };

        var enrichPrograms = function (programs) {
            var store = db.objectStore("programStageSections");
            return store.getAll().then(function (programStageSections) {
                var indexedProgramStageSections = _.indexBy(programStageSections, 'id');
                return _.each(programs, function (program) {
                    _.each(program.programStages, function (programStage) {
                        programStage.programStageSections = _.map(programStage.programStageSections, function (programStageSection) {
                            return _.merge(programStageSection, _.get(indexedProgramStageSections, programStageSection.id));
                        });
                    });
                });
            });
        };

        var enrichProgram = function (program) {
            if(!_.isUndefined(program)) {
                return enrichPrograms([program]).then(_.first);
            }
        };

        this.getProgramForOrgUnit = function(orgUnitId) {
            var store = db.objectStore("programs");
            return store.find("by_organisationUnit", orgUnitId).then(enrichProgram).then(addServiceCode);
        };

        this.getAll = function() {
            var store = db.objectStore("programs");
            return store.getAll()
                .then(enrichPrograms)
                .then(addServiceCode)
                .then(function(programs) {
                return _.filter(programs, function(p) {
                    return customAttributes.getBooleanAttributeValue(p.attributeValues, customAttributes.NEW_DATA_MODEL_CODE);
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
            return store.each(query).then(enrichPrograms).then(addServiceCode);
        };

        this.get = function(programId, excludedDataElements) {
            var getProgram = function(programId) {
                var programsStore = db.objectStore("programs");
                return programsStore.find(programId).then(enrichProgram);
            };

            var enrichDataElements = function(program) {
                if (!program) return undefined;
                var promises = [];
                _.each(program.programStages, function(stage) {
                    _.each(stage.programStageSections, function(section) {
                        section.isIncluded = false;
                        _.each(section.programStageDataElements, function(sde) {
                            promises.push(dataElementRepository.get(sde.dataElement.id).then(function(de) {
                                de.isIncluded = _.isEmpty(excludedDataElements) || !_.contains(excludedDataElements, de.id);
                                sde.dataElement = de;
                                section.isIncluded = section.isIncluded || de.isIncluded;
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
                .then(enrichDataElements);
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