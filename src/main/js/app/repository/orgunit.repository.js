define([], function() {
    return function(db) {
        var isOfType = function(orgUnit, type) {
            return _.any(orgUnit.attributeValues, {
                attribute: {
                    id: "a1fa2777924"
                },
                value: type
            });
        };

        this.upsert = function(payload) {
            var store = db.objectStore("organisationUnits");
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

        this.getAllModulesInProjects = function(projectIds) {
            return this.getAll().then(function(allOrgUnits) {

                var filterModules = function(orgUnits) {
                    return _.filter(orgUnits, function(orgUnit) {
                        return isOfType(orgUnit, "Module");
                    });
                };

                var getModulesUnderOrgUnits = function(modules) {
                    return _.filter(modules, function(module) {
                        return _.contains(projectIds, module.parent.id);
                    });
                };

                var getModulesUnderOpUnits = function(allModules) {
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

                        var modules = getModulesUnderOrgUnits(moduleParents);
                        if (!_.isEmpty(modules))
                            filteredModules.push(module);
                    });
                    return filteredModules;
                };

                var allModules = filterModules(allOrgUnits);
                return (getModulesUnderOrgUnits(allModules)).concat(getModulesUnderOpUnits(allModules));
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