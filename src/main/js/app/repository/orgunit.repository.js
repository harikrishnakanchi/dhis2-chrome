define(["moment", "lodashUtils"], function(moment, _) {
    return function(db, datasetRepository, $q) {
        var isOfType = function(orgUnit, type) {
            return _.any(orgUnit.attributeValues, {
                attribute: {
                    "code": "Type"
                },
                value: type
            });
        };

        var rejectOrgUnitsWithCurrentDatasets = function(orgUnits) {
            var getBooleanAttributeValue = function(attributeValues, attributeCode) {
                var attr = _.find(attributeValues, {
                    "attribute": {
                        "code": attributeCode
                    }
                });

                return attr && attr.value === 'true';
            };

            var isLinelistService = function(orgUnit) {
                return getBooleanAttributeValue(orgUnit.attributeValues, "isLineListService");
            };

            var indexDatasetsByOrgUnits = function() {
                return datasetRepository.getAll().then(function(datasets) {
                    return _.groupByArray(datasets, "orgUnitIds");
                });
            };

            var hasAnyNewDataset = function(datasets) {
                var isNewDataModel = function(ds) {
                    return getBooleanAttributeValue(ds.attributeValues, "isNewDataModel");
                };

                return _.any(datasets, function(ds) {
                    return isNewDataModel(ds);
                });
            };

            var filterModulesWithNewDatasets = function(aggregateModules, datasetsIndexedByOU) {
                return _.filter(aggregateModules, function(mod) {
                    var associatedDatasets = datasetsIndexedByOU[mod.id];
                    return _.isEmpty(associatedDatasets) || hasAnyNewDataset(associatedDatasets);
                });
            };

            var partitionedOrgUnits = _.partition(orgUnits, function(ou) {
                return !isOfType(ou, "Module") || isLinelistService(ou);
            });

            var otherOrgUnits = partitionedOrgUnits[0];
            var aggregateModules = partitionedOrgUnits[1];

            return indexDatasetsByOrgUnits()
                .then(_.curry(filterModulesWithNewDatasets)(aggregateModules))
                .then(function(modulesWithNewDatasets) {
                    return otherOrgUnits.concat(modulesWithNewDatasets);
                });
        };

        var addParentIdField = function(payload) {
            return _.map(payload, function(p) {
                p.parentId = p.parent ? p.parent.id : undefined;
                return p;
            });
        };

        var upsert = function(payload) {
            var addClientLastUpdatedField = function(payload) {
                return _.map(payload, function(p) {
                    p.clientLastUpdated = moment().toISOString();
                    return p;
                });
            };

            payload = _.isArray(payload) ? payload : [payload];
            payload = addClientLastUpdatedField(payload);
            payload = addParentIdField(payload);

            var store = db.objectStore("organisationUnits");
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        var upsertDhisDownloadedData = function(payload) {
            payload = addParentIdField(payload);
            var store = db.objectStore("organisationUnits");
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        var getAll = function(includeCurrent) {
            includeCurrent = includeCurrent === undefined ? true : includeCurrent;

            var store = db.objectStore("organisationUnits");
            var orgUnits = store.getAll();
            if (!includeCurrent)
                return orgUnits.then(rejectOrgUnitsWithCurrentDatasets);
            return orgUnits;
        };

        var get = function(orgUnitId) {
            var store = db.objectStore("organisationUnits");
            return store.find(orgUnitId);
        };

        var findAll = function(orgUnitIds) {
            var store = db.objectStore("organisationUnits");
            var query = db.queryBuilder().$in(orgUnitIds).compile();
            return store.each(query);
        };

        var findAllByParent = function(parentIds) {
            var store = db.objectStore("organisationUnits");
            var query = db.queryBuilder().$in(parentIds).$index("by_parent").compile();
            return store.each(query);
        };

        var getAllModulesInOrgUnits = function(orgUnitIds, rejectDisabled) {
            var getChildModules = function(orgUnitIds) {
                return findAllByParent(orgUnitIds).then(function(children) {
                    var moduleOrgUnits = [];
                    var nonModuleOrgUnits = [];

                    _.forEach(children, function(ou) {
                        if (isOfType(ou, 'Module')) {
                            moduleOrgUnits.push(ou);
                        } else {
                            nonModuleOrgUnits.push(ou);
                        }
                    });

                    if (_.isEmpty(nonModuleOrgUnits)) {
                        return moduleOrgUnits;
                    }

                    return getChildModules(_.pluck(nonModuleOrgUnits, "id")).then(function(data) {
                        return moduleOrgUnits.concat(data);
                    });
                });
            };

            var rejectDisabledOrgUnits = function(allOrgUnits) {

                if (!rejectDisabled)
                    return allOrgUnits;

                return _.reject(allOrgUnits, function(module) {
                    var isDisabledAttribute = _.find(module.attributeValues, {
                        'attribute': {
                            'code': 'isDisabled'
                        }
                    });
                    return isDisabledAttribute && isDisabledAttribute.value === "true";
                });
            };
            orgUnitIds = _.isArray(orgUnitIds) ? orgUnitIds : [orgUnitIds];
            return getChildModules(orgUnitIds)
                .then(rejectOrgUnitsWithCurrentDatasets)
                .then(rejectDisabledOrgUnits);
        };

        var getProjectAndOpUnitAttributes = function(module) {
            var attributes_arr = [];

            var pushAttributeValues = function(attributes) {
                _.forEach(attributes, function(attribute) {
                    attributes_arr.push(attribute);
                });
            };

            var getAttributes = function(orgUnits) {
                var opUnit = _.find(orgUnits, {
                    'id': module.parent.id
                });
                var project = _.find(orgUnits, {
                    'id': opUnit.parent.id
                });

                pushAttributeValues(opUnit.attributeValues);
                pushAttributeValues(project.attributeValues);

                return attributes_arr;
            };

            return getAll().then(getAttributes);
        };

        var getAllProjects = function() {
            var getAttributeValue = function(orgUnit, attrCode) {
                return _.find(orgUnit.attributeValues, {
                    "attribute": {
                        "code": attrCode
                    }
                }).value;
            };

            var filterProjects = function(orgUnits) {
                return _.filter(orgUnits, function(orgUnit) {
                    return isOfType(orgUnit, "Project");
                });
            };

            var mapProjectCode = function(orgUnits) {
                return _.map(orgUnits, function(orgUnit) {
                    orgUnit.code = getAttributeValue(orgUnit, "projCode");
                    return orgUnit;
                });
            };

            return getAll()
                .then(filterProjects)
                .then(mapProjectCode);
        };

        return {
            "upsert": upsert,
            "upsertDhisDownloadedData": upsertDhisDownloadedData,
            "getAll": getAll,
            "get": get,
            "findAll": findAll,
            "findAllByParent": findAllByParent,
            "getAllModulesInOrgUnits": getAllModulesInOrgUnits,
            "getProjectAndOpUnitAttributes": getProjectAndOpUnitAttributes,
            "getAllProjects": getAllProjects
        };
    };
});
