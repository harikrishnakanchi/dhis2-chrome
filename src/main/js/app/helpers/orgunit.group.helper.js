define([], function() {
    return function($hustle, $q, $scope, orgUnitRepository, orgUnitGroupRepository) {
        this.createOrgUnitGroups = function(orgunits, isUpdateProject) {
            var getOrgUnitGroups = function() {
                return orgUnitGroupRepository.getAll()
                    .then(function(result) {
                        return result;
                    });
            };

            var getAttributes = function(orgunit) {
                return orgUnitRepository.getProjectAndOpUnitAttributes(orgunit).then(function(result) {
                    return result;
                });
            };

            var addOrgunitsToOrgUnitGroups = function(orgUnitGroups) {
                var addToGroup = function(attributes) {
                    var orgunitsToAdd = _.map(orgunits, function(orgunit) {
                        return {
                            'id': orgunit.id,
                            'name': orgunit.name
                        };
                    });

                    var modifiedOrgUnitGroups = [];
                    _.forEach(orgUnitGroups, function(orgUnitGroup) {
                        var res;
                        if (orgUnitGroup.name.indexOf("Unit Code - ") !== -1) {
                            var orgUnitGroupName = orgUnitGroup.name.replace("Unit Code - ", "");
                            res = _.find(attributes, {
                                'value': orgUnitGroupName.trim()
                            });
                        } else {
                            res = _.find(attributes, {
                                'value': orgUnitGroup.name.trim()
                            });
                        }

                        if (isUpdateProject) {
                            orgUnitGroup.organisationUnits = _.filter(orgUnitGroup.organisationUnits, function(obj) {
                                return !_.findWhere(orgunitsToAdd, {
                                    id: obj.id
                                });
                            });
                            orgUnitGroup.organisationUnits = _.reject(orgUnitGroup.organisationUnits, orgunitsToAdd);
                        }

                        var isOrgUnitAbsent = !_.find(orgUnitGroup.organisationUnits, orgunitsToAdd);

                        if (res !== undefined && isOrgUnitAbsent) {
                            _.forEach(orgunitsToAdd, function(orgunitToAdd) {
                                orgUnitGroup.organisationUnits.push(orgunitToAdd);
                            });
                        }
                        modifiedOrgUnitGroups.push(orgUnitGroup);
                    });
                    return modifiedOrgUnitGroups;
                };

                var upsertOrgUnitGroup = function(orgUnitGroups) {
                    orgUnitGroupRepository.upsert(orgUnitGroups).then(function() {
                        return $hustle.publish({
                            "data": orgUnitGroups,
                            "type": "upsertOrgUnitGroups"
                        }, "dataValues");
                    });
                };

                return getAttributes(orgunits[0]).then(addToGroup).then(upsertOrgUnitGroup);
            };

            return getOrgUnitGroups().then(addOrgunitsToOrgUnitGroups);
        };

        this.getOrgUnitsToAssociateForUpdate = function(orgunits) {
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

            var orgUnitsToAssociate = [];

            _.forEach(orgunits, function(orgunit) {
                if (isLinelistService(orgunit))
                    orgUnitsToAssociate.push(orgunit.children);
                else
                    orgUnitsToAssociate.push(orgunit);

            });
            return _.flatten(orgUnitsToAssociate);

        };
    };
});