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
                    return [result, orgunit];
                });
            };

            var addOrgunitsToOrgUnitGroups = function(orgUnitGroups) {
                var addToGroup = function(data) {
                    var attributes = data[0];
                    var orgunit = data[1];
                    var orgunitToAdd = {
                        'id': orgunit.id,
                        'name': orgunit.name
                    };
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
                            orgUnitGroup.organisationUnits = _.reject(orgUnitGroup.organisationUnits, orgunitToAdd);
                        }
                        var isOrgUnitAbsent = !_.find(orgUnitGroup.organisationUnits, orgunitToAdd);

                        if (res !== undefined && isOrgUnitAbsent) {
                            orgUnitGroup.organisationUnits.push(orgunitToAdd);
                            modifiedOrgUnitGroups.push(orgUnitGroup);
                        }
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

                var promises = _.map(orgunits, function(orgunit) {
                    return getAttributes(orgunit);
                });
                
                $q.all(promises).then(function(attrsList) {
                    _.forEach(attrsList, function(attrs) {
                        var orgunitGroups = addToGroup(attrs);
                        $q.when(orgUnitGroups).then(function(orgUnitGroups) {
                            upsertOrgUnitGroup(orgUnitGroups);
                        });
                    });
                });
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