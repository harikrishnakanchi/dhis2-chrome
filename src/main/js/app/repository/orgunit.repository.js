define(["moment", "lodashUtils"], function(moment, _) {
    return function(db, $q) {
        var isOfType = function(orgUnit, type) {
            return _.any(orgUnit.attributeValues, {
                attribute: {
                    "code": "Type"
                },
                value: type
            });
        };

        var rejectCurrentAndDisabled = function(orgUnits) {
            var getBooleanAttributeValue = function(attributeValues, attributeCode) {
                var attr = _.find(attributeValues, {
                    "attribute": {
                        "code": attributeCode
                    }
                });

                return attr && attr.value === 'true';
            };
            return _.filter(orgUnits, function(ou) {
                return getBooleanAttributeValue(ou.attributeValues, "isNewDataModel") && !getBooleanAttributeValue(ou.attributeValues, "isDisabled");
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

        var getAll = function() {
            var store = db.objectStore("organisationUnits");
            var orgUnits = store.getAll();
            return orgUnits.then(rejectCurrentAndDisabled);
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

        var findAllByParent = function(parentIds, rejectDisabled) {
            rejectDisabled = _.isUndefined(rejectDisabled) ? true : rejectDisabled;
            parentIds = _.isArray(parentIds) ? parentIds : [parentIds];
            var store = db.objectStore("organisationUnits");
            var query = db.queryBuilder().$in(parentIds).$index("by_parent").compile();

            if (rejectDisabled)
                return store.each(query).then(rejectCurrentAndDisabled);

            return store.each(query);
        };

        var getProjectAndOpUnitAttributes = function(moduleOrOriginId) {
            var getAttributes = function(orgUnits) {
                return get(moduleOrOriginId).then(function(enrichedModuleOrOrigin) {
                    var isOrigin = _.any(enrichedModuleOrOrigin.attributeValues, {
                        "value": "Patient Origin"
                    });

                    var module = isOrigin === true ? _.find(orgUnits, {
                        'id': enrichedModuleOrOrigin.parent.id
                    }) : enrichedModuleOrOrigin;

                    var opUnit = _.find(orgUnits, {
                        'id': module.parent.id
                    });
                    var project = _.find(orgUnits, {
                        'id': opUnit.parent.id
                    });

                    return opUnit.attributeValues.concat(project.attributeValues);
                });
            };

            return getAll().then(getAttributes);
        };

        var getAllProjects = function() {
            var filterProjects = function(orgUnits) {
                return _.filter(orgUnits, function(orgUnit) {
                    return isOfType(orgUnit, "Project");
                });
            };

            return getAll().then(filterProjects);
        };

        var getParentProject = function(orgUnitId) {
            return get(orgUnitId).then(function(orgUnit) {
                if (isOfType(orgUnit, 'Project')) {
                    return orgUnit;
                } else {
                    return getParentProject(orgUnit.parent.id);
                }
            });
        };

        var getAllModulesInOrgUnits = function(orgUnitIds) {

            orgUnitIds = _.flatten([orgUnitIds]);

            var partitionModules = function(orgunits) {
                return _.partition(orgunits, function(ou) {
                    return isOfType(ou, 'Module');
                });
            };

            var getChildModules = function(orgUnits) {

                return findAllByParent(_.pluck(orgUnits, "id")).then(function(children) {
                    var partitionedOrgUnits = partitionModules(children);
                    var moduleOrgUnits = partitionedOrgUnits[0];
                    var nonModuleOrgUnits = partitionedOrgUnits[1];

                    if (_.isEmpty(nonModuleOrgUnits)) {
                        return moduleOrgUnits;
                    }

                    return getChildModules(nonModuleOrgUnits).then(function(data) {
                        return moduleOrgUnits.concat(data);
                    });
                });
            };

            return findAll(orgUnitIds).then(function(orgUnits) {
                var partitionedOrgUnits = partitionModules(orgUnits);
                var moduleOrgUnits = partitionedOrgUnits[0];
                var nonModuleOrgUnits = partitionedOrgUnits[1];

                return getChildModules(nonModuleOrgUnits).then(function(childrenModules) {
                    return childrenModules.concat(moduleOrgUnits);
                });
            });
        };

        var getChildOrgUnitNames = function(parentIds) {
            parentIds = _.isArray(parentIds) ? parentIds : [parentIds];
            var store = db.objectStore("organisationUnits");
            var query = db.queryBuilder().$in(parentIds).$index("by_parent").compile();
            return store.each(query).then(function(children) {
                return _.pluck(children, "name");
            });
        };

        var getAllOriginsByName = function(opUnit, originName, rejectDisabledOrigins) {
            return findAllByParent(opUnit.id).then(function(modules) {
                var moduleIds = _.pluck(modules, "id");
                return findAllByParent(moduleIds, rejectDisabledOrigins).then(function(origins) {
                    return _.remove(origins, {
                        "name": originName
                    });
                });
            });
        };

        var getAllOrigins = function(modules) {
            var moduleIds = _.pluck(modules, "id");
            return findAllByParent(moduleIds, true).then(function(origins) {
                return origins;
            });
        };

        return {
            "upsert": upsert,
            "upsertDhisDownloadedData": upsertDhisDownloadedData,
            "getAll": getAll,
            "get": get,
            "findAll": findAll,
            "findAllByParent": findAllByParent,
            "getProjectAndOpUnitAttributes": getProjectAndOpUnitAttributes,
            "getAllProjects": getAllProjects,
            "getParentProject": getParentProject,
            "getAllModulesInOrgUnits": getAllModulesInOrgUnits,
            "getChildOrgUnitNames": getChildOrgUnitNames,
            "getAllOriginsByName": getAllOriginsByName,
            "getAllOrigins": getAllOrigins
        };
    };
});
