define([], function() {
    return function(db) {
        var isOfType = function(orgUnit, type) {
            return _.any(orgUnit.attributeValues, {
                attribute: {
                    "code": "Type"
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

        this.getOrgUnit = function(orgUnitId) {
            var store = db.objectStore("organisationUnits");
            return store.find(orgUnitId);
        };

        this.getAllModulesInProjects = function(projectIds, rejectDisabled) {
            return this.getAll().then(function(allOrgUnits) {
                var getChildModules = function(orgUnitId) {
                    return _.flatten(_.transform(allOrgUnits[orgUnitId][0].children, function(acc, child) {
                        child = allOrgUnits[child.id][0];
                        if (isOfType(child, "Module")) {
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

                return _.filter(allOrgUnits, function(orgUnit){
                    if(orgUnit.parent && orgUnit.parent.id === opUnitId){
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
    };
});