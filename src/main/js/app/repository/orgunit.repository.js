define(["moment", "lodash"], function(moment, _) {
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
            var isLinelistService = function(orgUnit) {
                var linelistAttribute = _.find(orgUnit.attributeValues, {
                    "attribute": {
                        "code": "isLineListService"
                    }
                });

                return linelistAttribute ? linelistAttribute.value === "true" : false;
            };

            var isModuleWithNewDatasets = function(module) {
                var isNewDataModel = function(ds) {
                    var attr = _.find(ds.attributeValues, {
                        "attribute": {
                            "code": 'isNewDataModel'
                        }
                    });
                    return attr.value === 'true';
                };

                return datasetRepository.getAllForOrgUnit(module.id).then(function(datasets) {
                    return _.any(datasets, function(ds) {
                        return isNewDataModel(ds);
                    });
                });
            };

            var promises = [];

            var returnOrgUnits = [];

            _.forEach(orgUnits, function(orgUnit) {
                if (!isOfType(orgUnit, "Module") || isLinelistService(orgUnit)) {
                    returnOrgUnits.push(orgUnit);
                } else {
                    promises.push(isModuleWithNewDatasets(orgUnit).then(function(answer) {
                        if (answer === true)
                            returnOrgUnits.push(orgUnit);
                    }));
                }
            });

            return $q.all(promises).then(function() {
                return returnOrgUnits;
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

            var store = db.objectStore("organisationUnits");
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        var upsertDhisDownloadedData = function(payload) {
            var store = db.objectStore("organisationUnits");
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        var getAll = function(includeCurrent) {
            includeCurrent = includeCurrent === undefined ? true : includeCurrent;
            var populateDisplayName = function(allOrgUnits, orgUnit) {
                var parent = _.find(allOrgUnits, {
                    'id': orgUnit.parent ? orgUnit.parent.id : undefined
                });
                return _.merge(orgUnit, {
                    displayName: parent && isOfType(parent, "Operation Unit") ? parent.name + " - " + orgUnit.name : orgUnit.name
                });
            };

            var store = db.objectStore("organisationUnits");
            var orgUnits = store.getAll().then(function(allOrgUnits) {
                return _.map(allOrgUnits, _.curry(populateDisplayName)(allOrgUnits));
            });

            if (!includeCurrent)
                return orgUnits.then(rejectOrgUnitsWithCurrentDatasets);

            return orgUnits;
        };

        var get = function(orgUnitId) {
            var store = db.objectStore("organisationUnits");
            return store.find(orgUnitId);
        };

        var getAllModulesInOrgUnits = function(orgUnitIds, rejectDisabled) {
            var filterModulesInProjects = function(orgUnits) {
                var allOrgUnitsById = _.indexBy(orgUnits, "id");

                var getChildModules = function(orgUnitId) {
                    return _.flatten(_.transform(allOrgUnitsById[orgUnitId].children, function(acc, child) {
                        child = allOrgUnitsById[child.id];
                        if (isOfType(child, "Module"))
                            acc.push(child);
                        else
                            acc.push(getChildModules(child.id));
                    }));
                };


                var modules = _.flatten(_.transform(orgUnitIds, function(acc, orgUnitId) {
                    acc.push(getChildModules(orgUnitId));
                }));

                return modules;
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

            return getAll()
                .then(filterModulesInProjects)
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
            "getAllModulesInOrgUnits": getAllModulesInOrgUnits,
            "getProjectAndOpUnitAttributes": getProjectAndOpUnitAttributes,
            "getAllProjects": getAllProjects
        };
    };
});
