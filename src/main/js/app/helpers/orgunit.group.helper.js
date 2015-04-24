define([], function() {
    return function($hustle, $q, $scope, orgUnitRepository, orgUnitGroupRepository) {
        this.createOrgUnitGroups = function(orgUnits, isUpdateProject) {
            var orgUnitGroups;
            var getOrgUnitGroups = function() {
                return orgUnitGroupRepository.getAll().then(function(data) {
                    orgUnitGroups = data;
                });
            };

            var removeOrgUnitsFromOldGroups = function() {
                if (isUpdateProject) {
                    orgUnitGroups = _.map(orgUnitGroups, function(group) {
                        group.organisationUnits = _.differenceBy(group.organisationUnits, orgUnits, "id");
                        return group;
                    });
                }
            };

            var addOrgUnitsToNewGroups = function() {
                var findGroupByAttrValue = function(attribute) {
                    var attrValue = attribute.attribute.code === "hospitalUnitCode" ? "Unit Code - " + attribute.value : attribute.value;
                    return _.find(orgUnitGroups, "name", attrValue);
                };

                var orgUnitsToAdd = _.map(orgUnits, function(orgUnit) {
                    return {
                        'id': orgUnit.id,
                        'name': orgUnit.name
                    };
                });

                return orgUnitRepository.getProjectAndOpUnitAttributes(orgUnits[0].id).then(function(attributeValues) {
                    _.forEach(attributeValues, function(attr) {
                        var group = findGroupByAttrValue(attr);
                        group.organisationUnits = group.organisationUnits.concat(orgUnitsToAdd);
                    });
                });
            };

            var upsertOrgUnitGroups = function() {
                return orgUnitGroupRepository.upsert(orgUnitGroups).then(function() {
                    return $hustle.publish({
                        "data": orgUnitGroups,
                        "type": "upsertOrgUnitGroups",
                        "locale": $scope.currentUser.locale,
                        "desc": $scope.resourceBundle.upsertOrgUnitGroupsDesc
                    }, "dataValues");
                });
            };

            return getOrgUnitGroups()
                .then(removeOrgUnitsFromOldGroups)
                .then(addOrgUnitsToNewGroups)
                .then(upsertOrgUnitGroups);
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
