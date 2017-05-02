define(["moment", "lodashUtils", "customAttributes"], function(moment, _, customAttributes) {
    return function(db, $q) {
        var ORGANISATION_UNITS_STORE_NAME = 'organisationUnits';
        var isOfType = function(orgUnit, type) {
            return customAttributes.getAttributeValue(orgUnit.attributeValues, customAttributes.TYPE) === type;
        };

        var rejectCurrentAndDisabled = function(orgUnits) {
            return _.filter(orgUnits, function(ou) {
                return customAttributes.getBooleanAttributeValue(ou.attributeValues, customAttributes.NEW_DATA_MODEL_CODE) && !customAttributes.getBooleanAttributeValue(ou.attributeValues, customAttributes.DISABLED_CODE);
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

            var store = db.objectStore(ORGANISATION_UNITS_STORE_NAME);
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        var upsertDhisDownloadedData = function(payload) {
            payload = addParentIdField(payload);
            var store = db.objectStore(ORGANISATION_UNITS_STORE_NAME);
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        var getAll = function() {
            var store = db.objectStore(ORGANISATION_UNITS_STORE_NAME);
            var orgUnits = store.getAll();
            return orgUnits.then(rejectCurrentAndDisabled);
        };

        var get = function(orgUnitId) {
            var store = db.objectStore(ORGANISATION_UNITS_STORE_NAME);
            return store.find(orgUnitId);
        };

        var findAll = function(orgUnitIds) {
            var store = db.objectStore(ORGANISATION_UNITS_STORE_NAME);
            var query = db.queryBuilder().$in(orgUnitIds).compile();
            return store.each(query);
        };

        var findAllByParent = function(parentIds, rejectDisabled) {
            rejectDisabled = _.isUndefined(rejectDisabled) ? true : rejectDisabled;
            parentIds = _.isArray(parentIds) ? parentIds : [parentIds];
            var store = db.objectStore(ORGANISATION_UNITS_STORE_NAME);
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

        var getAssociatedOrganisationUnitGroups = function (moduleOrOriginId) {
            var getAssociations = function(orgUnits) {
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

                    return _.map(opUnit.organisationUnitGroups, 'id').concat(_.map(project.organisationUnitGroups, 'id'));
                });
            };

            return getAll().then(getAssociations);
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
            return getChildrenOfTypeInOrgUnits(orgUnitIds, "Module");
        };

        var getAllOpUnitsInOrgUnits = function(orgUnitIds) {
            return getChildrenOfTypeInOrgUnits(orgUnitIds, "Operation Unit");
        };

        var getAllOriginsInOrgUnits = function(orgUnitIds) {
            return getChildrenOfTypeInOrgUnits(orgUnitIds, "Origin");
        };

        var getAllOrgUnitsUnderProject = function(project) {
            var orgUnits = [];
            orgUnits.push(project);
            return getAllOpUnitsInOrgUnits([project.id]).then(function(opunits) {
                orgUnits.push(opunits);
                return getAllModulesInOrgUnits([project.id]).then(function(modules) {
                    orgUnits.push(modules);
                    return getAllOriginsInOrgUnits([project.id]).then(function(origins) {
                        orgUnits.push(origins);
                        return orgUnits;
                    });
                });
            });
        };

        var getOrgUnitAndDescendants = function(maxLevel, orgUnitId){

            var getAllWithinMaxLevel = function(){
                return getAll().then(function(allOrgUnits) {
                    return _.filter(allOrgUnits, function(orgUnit){
                        return orgUnit.level <= maxLevel;
                    });
                });
            };

            var groupByParentId = function(orgUnits){
                return _.groupBy(orgUnits, "parent.id");
            };

            var getRootOrgUnit = function(orgUnits, orgUnitsGroupedByParentId){
                return orgUnitId ? _.find(orgUnits, {'id': orgUnitId}) : _.first(orgUnitsGroupedByParentId[undefined]);
            };

            var getDescendantOrgUnits = function(orgUnits, orgUnitsGroupedByParentId) {
                return _.compact(_.flatten(_.map(orgUnits, function (orgUnit) {
                    return orgUnitsGroupedByParentId[orgUnit.id];
                })));
            };

            var getAllOrgUnits = function(allOrgUnits) {
                var orgUnitAndDescendants = [];
                var orgUnitsGroupedByParentId = groupByParentId(allOrgUnits);

                var rootOrgUnit = getRootOrgUnit(allOrgUnits, orgUnitsGroupedByParentId);
                orgUnitAndDescendants = orgUnitAndDescendants.concat(rootOrgUnit);

                var descendantOrgUnits = orgUnitsGroupedByParentId[rootOrgUnit.id];

                while(descendantOrgUnits && descendantOrgUnits.length > 0){
                    orgUnitAndDescendants = orgUnitAndDescendants.concat(descendantOrgUnits);
                    descendantOrgUnits = getDescendantOrgUnits(descendantOrgUnits, orgUnitsGroupedByParentId);
                }

                return orgUnitAndDescendants;
            };

            return getAllWithinMaxLevel().then(getAllOrgUnits);

        };

        var getChildrenOfTypeInOrgUnits = function(orgUnitIds, requestedType) {
            var partitionRequestedOrgUnits = function(orgunits) {
                return _.partition(orgunits, function(orgUnit) {
                    return isOfType(orgUnit, requestedType);
                });
            };

            var partitionAndGetChildOrgUnits = function(orgUnits) {
                var partitionedOrgUnits = partitionRequestedOrgUnits(orgUnits);
                var requestedOrgUnits = partitionedOrgUnits[0];
                var otherOrgUnits = partitionedOrgUnits[1];

                if (_.isEmpty(otherOrgUnits)) {
                    return requestedOrgUnits;
                }

                return getChildOrgUnits(otherOrgUnits).then(function(childOrgUnits) {
                    return requestedOrgUnits.concat(childOrgUnits);
                });
            };

            var getChildOrgUnits = function(orgUnits) {
                var ids = _.pluck(orgUnits, "id");
                return findAllByParent(ids).then(partitionAndGetChildOrgUnits);
            };

            var ids = _.flatten([orgUnitIds]);
            return findAll(ids)
                .then(partitionAndGetChildOrgUnits)
                .then(function(data){
                    return _.uniq(data);
                });
        };

        var getChildOrgUnitNames = function(parentIds) {
            parentIds = _.isArray(parentIds) ? parentIds : [parentIds];
            var store = db.objectStore(ORGANISATION_UNITS_STORE_NAME);
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

        var enrichWithParent = function (orgUnit) {
            var getAndStoreParent = function (orgUnit) {
                if(!orgUnit.parent) return $q.when(orgUnit);

                return get(orgUnit.parent.id).then(function (parent) {
                    orgUnit.parent = parent;
                    return orgUnit;
                });
            };
            return _.isArray(orgUnit) ? $q.all(_.map(orgUnit, getAndStoreParent)) : getAndStoreParent(orgUnit);
        };

        var associateDataSetsToOrgUnits = function (dataSetIds, orgUnits) {
            var store = db.objectStore(ORGANISATION_UNITS_STORE_NAME);
            return $q.all(_.map(orgUnits, function (orgUnit) {
                var payload = orgUnit;
                var dataSetsToAdd = _.transform(dataSetIds, function (result, dataSetId) {
                    var dataSetToAdd = { id: dataSetId };
                    if (!_.some(payload.dataSets, dataSetToAdd)) {
                        result.push({id: dataSetId});
                    }
                });
                payload.dataSets = payload.dataSets ? payload.dataSets.concat(dataSetsToAdd) : [].concat(dataSetsToAdd);
                return store.upsert(payload);
            }));
        };

        var removeDataSetsFromOrgUnits = function (dataSetIdsToRemoved, orgUnits) {
            var store = db.objectStore(ORGANISATION_UNITS_STORE_NAME);
            return $q.all(_.map(orgUnits, function (orgUnit) {
                var payload = orgUnit;
                payload.dataSets = _.reject(orgUnit.dataSets, function (dataSet) {
                    return _.contains(dataSetIdsToRemoved, dataSet.id);
                });
                return store.upsert(orgUnit);
            }));
        };

        var getAllDataSetsForOrgUnit = function (orgUnitId) {
            return get(orgUnitId).then(function (orgUnit) {
                return orgUnit.dataSets;
            });
        };

        return {
            "upsert": upsert,
            "upsertDhisDownloadedData": upsertDhisDownloadedData,
            "get": get,
            "findAll": findAll,
            "findAllByParent": findAllByParent,
            "getProjectAndOpUnitAttributes": getProjectAndOpUnitAttributes,
            "getAllProjects": getAllProjects,
            "getParentProject": getParentProject,
            "getAllModulesInOrgUnits": getAllModulesInOrgUnits,
            "getAllOpUnitsInOrgUnits": getAllOpUnitsInOrgUnits,
            "getChildOrgUnitNames": getChildOrgUnitNames,
            "getAllOriginsByName": getAllOriginsByName,
            "getAllOriginsInOrgUnits": getAllOriginsInOrgUnits,
            "getAllOrgUnitsUnderProject": getAllOrgUnitsUnderProject,
            "getOrgUnitAndDescendants": getOrgUnitAndDescendants,
            "enrichWithParent": enrichWithParent,
            "associateDataSetsToOrgUnits": associateDataSetsToOrgUnits,
            "removeDataSetsFromOrgUnits": removeDataSetsFromOrgUnits,
            "getAllDataSetsForOrgUnit": getAllDataSetsForOrgUnit,
            "getAssociatedOrganisationUnitGroups": getAssociatedOrganisationUnitGroups
        };
    };
});
