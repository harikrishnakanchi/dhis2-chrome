define(["moment", "lodash"], function(moment, _) {
    return function(db, datasetRepository, q) {
        var isOfType = function(orgUnit, type) {
            return _.any(orgUnit.attributeValues, {
                attribute: {
                    "code": "Type"
                },
                value: type
            });
        };

        var isLinelistService = function(orgUnit) {
            var linelistAttribute = _.find(orgUnit.attributeValues, {
                "attribute": {
                    "code": "isLineListService"
                }
            });

            return linelistAttribute ? linelistAttribute.value === "true" : false;
        };

        var getNewDataSetIds = function() {
            var isNewDataModel = function(ds) {
                var attr = _.find(ds.attributeValues, {
                    "attribute": {
                        "code": 'isNewDataModel'
                    }
                });
                return attr.value === 'true';
            };
            return datasetRepository.getAll().then(function(datasets) {
                return _.pluck(_.filter(datasets, isNewDataModel), "id");
            });
        };

        var notACurrentModule = function(module, newDataSetIds) {
            if (isLinelistService(module)) {
                return true;
            } else if (!_.isEmpty(module.dataSets) && _.contains(newDataSetIds, (module.dataSets[0]).id)) {
                return true;
            } else {
                return false;
            }
        };

        this.upsert = function(payload) {
            payload = _.isArray(payload) ? payload : [payload];
            var addLastUpdatedField = function(payload) {
                return _.map(payload, function(p) {
                    p.lastUpdated = moment().toISOString();
                    return p;
                });
            };

            var store = db.objectStore("organisationUnits");
            payload = addLastUpdatedField(payload);

            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        this.getAll = function() {
            var populateDisplayName = function(allOrgUnits, orgUnit) {
                var parent = _.find(allOrgUnits, {
                    'id': orgUnit.parent ? orgUnit.parent.id : undefined
                });
                return _.merge(orgUnit, {
                    displayName: parent && isOfType(parent, "Operation Unit") ? parent.name + " - " + orgUnit.name : orgUnit.name
                });
            };

            var store = db.objectStore("organisationUnits");
            return store.getAll().then(function(allOrgUnits) {
                return _.map(allOrgUnits, _.curry(populateDisplayName)(allOrgUnits));
            });
        };

        this.getOrgUnit = function(orgUnitId) {
            var store = db.objectStore("organisationUnits");
            return store.find(orgUnitId);
        };

        this.getAllModulesInProjects = function(projectIds, rejectDisabled) {
            return q.all([this.getAll(), getNewDataSetIds()]).then(function(data){
                var allOrgUnits = data[0];
                var newDataSetIds = data[1];

                var getChildModules = function(orgUnitId) {
                    return _.flatten(_.transform(allOrgUnits[orgUnitId][0].children, function(acc, child) {
                        child = allOrgUnits[child.id][0];
                        if (isOfType(child, "Module") && (notACurrentModule(child, newDataSetIds))) {
                            acc.push(child);
                        } else {
                            acc.push(getChildModules(child.id));
                        }
                    }));
                };

                var filterDisabled = function(modules) {
                    return _.reject(modules, function(module) {
                        var isDisabledAttribute = _.find(module.attributeValues, {
                            'attribute': {
                                'code': 'isDisabled'
                            }
                        });
                        return isDisabledAttribute && isDisabledAttribute.value;
                    });
                };

                allOrgUnits = _.groupBy(allOrgUnits, "id");
                var allChildModules = _.flatten(_.transform(projectIds, function(acc, projectId) {
                    acc.push(getChildModules(projectId));
                }));

                if (rejectDisabled) {
                    allChildModules = filterDisabled(allChildModules);
                }
                return allChildModules;
            });
        };

        this.getAllModulesInOpUnit = function(opUnitId) {
            return this.getAll().then(function(allOrgUnits) {

                return _.filter(allOrgUnits, function(orgUnit) {
                    if (orgUnit.parent && orgUnit.parent.id === opUnitId) {
                        return orgUnit;
                    }
                });
            });
        };

        this.getProjectAndOpUnitAttributes = function(module_t) {
            var attributes_arr = [];

            var pushAttributeValues = function(attributes) {
                _.forEach(attributes, function(attribute) {
                    attributes_arr.push(attribute);
                });
            };

            var getAttributes = function(orgUnits) {
                var opUnit = _.find(orgUnits, {
                    'id': module_t.parent.id
                });
                var project = _.find(orgUnits, {
                    'id': opUnit.parent.id
                });

                pushAttributeValues(opUnit.attributeValues);
                pushAttributeValues(project.attributeValues);

                return attributes_arr;
            };

            return this.getAll().then(getAttributes);
        };

        this.getAllProjects = function() {
            var getAttributeValue = function(orgUnit, attrCode) {
                return _.find(orgUnit.attributeValues, {
                    "attribute": {
                        "code": attrCode
                    }
                }).value;
            };

            var filterProjects = function(orgUnits) {
                return _.filter(orgUnits, function(orgUnit) {
                    return getAttributeValue(orgUnit, "Type") === "Project";
                });
            };

            var mapProjectCode = function(orgUnits) {
                return _.map(orgUnits, function(orgUnit) {
                    orgUnit.code = getAttributeValue(orgUnit, "projCode");
                    return orgUnit;
                });
            };

            return this.getAll().then(filterProjects).then(mapProjectCode);
        };

        this.getAllOrgUnitsExceptCurrentOrgUnits = function() {
            var getAllOrgUnits = function() {
                var store = db.objectStore("organisationUnits");
                return store.getAll();
            };

            var rejectCurrentModules = function(data) {
                var orgUnits = data[0];
                var newDataSetIds = data[1];
                return _.transform(orgUnits, function(acc, orgUnit) {
                    if (!isOfType(orgUnit, "Module")) {
                        return acc.push(orgUnit);
                    } else if (notACurrentModule(orgUnit, newDataSetIds)) {
                        return acc.push(orgUnit);
                    }
                }, []);
            };

            return q.all([getAllOrgUnits(), getNewDataSetIds()]).then(rejectCurrentModules);
        };
    };
});