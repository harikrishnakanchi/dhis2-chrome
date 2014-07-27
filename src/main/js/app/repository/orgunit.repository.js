define([], function() {
    return function(db) {
        this.upsert = function(payload) {
            var store = db.objectStore("organisationUnits");
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        this.getAll = function() {
            var store = db.objectStore("organisationUnits");
            return store.getAll();
        };

        this.getAllModulesInProjects = function(projectIds) {
            return this.getAll().then(function(allOrgUnits) {
                var isOfType = function(orgUnit, type) {
                    return _.any(orgUnit.attributeValues, {
                        attribute: {
                            id: "a1fa2777924"
                        },
                        value: type
                    });
                };

                var filterModules = function(orgUnits) {
                    var populateDisplayName = function(module) {
                        var parent = _.find(orgUnits, {
                            'id': module.parent.id
                        });
                        return _.merge(module, {
                            displayName: isOfType(parent, "Operation Unit") ? parent.name + " - " + module.name : module.name
                        });
                    };

                    var modules = _.filter(orgUnits, function(orgUnit) {
                        return isOfType(orgUnit, "Module");
                    });
                    return _.map(modules, populateDisplayName);
                };

                var getModulesForOrgUnits = function(modules) {
                    return _.filter(modules, function(module) {
                        return _.contains(projectIds, module.parent.id);
                    });
                };

                var getModulesUnderOpUnitsForOrgUnits = function(allModules) {
                    var filteredModules = [];
                    _.forEach(allModules, function(module) {
                        var moduleParents = _.filter(allOrgUnits, {
                            'id': module.parent.id,
                            'attributeValues': [{
                                'attribute': {
                                    id: "a1fa2777924"
                                },
                                value: "Operation Unit"
                            }]
                        });

                        var modules = getModulesForOrgUnits(moduleParents);
                        if (!_.isEmpty(modules))
                            filteredModules.push(module);
                    });
                    return filteredModules;
                };

                var allModules = filterModules(allOrgUnits);
                return (getModulesForOrgUnits(allModules)).concat(getModulesUnderOpUnitsForOrgUnits(allModules));
            });
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
    };
});