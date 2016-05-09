define([], function() {
    return function($hustle, $q, $scope, orgUnitRepository, orgUnitGroupRepository) {
        this.createOrgUnitGroups = function(orgUnits, isUpdateProject) {
            var orgUnitGroups;
            var getOrgUnitGroups = function() {
                return orgUnitGroupRepository.getAll().then(function(data) {
                    orgUnitGroups = data;
                });
            };

            var identifyGroupsToModify = function() {
                var getNewGroupAssociations = function() {
                    var findGroupByAttrValue = function(attribute) {
                        var attrValue = attribute.attribute.code === "hospitalUnitCode" ? "Unit Code - " + attribute.value : attribute.value;
                        return _.find(orgUnitGroups, "name", attrValue);
                    };

                    return orgUnitRepository.getProjectAndOpUnitAttributes(orgUnits[0].id).then(function(attributeValues) {
                        return _.transform(attributeValues, function(acc, attr) {
                            var group = findGroupByAttrValue(attr);
                            if (group) acc.push(group);
                        }, []);
                    });
                };

                var getExistingGroupAssociations = function() {
                    if (!isUpdateProject) return $q.when([]);

                    return $q.when(_.transform(orgUnitGroups, function(acc, group) {
                        if (!_.isEmpty(_.intersectionBy(group.organisationUnits, orgUnits, "id"))) acc.push(group);
                    }, []));
                };

                return $q.all([getNewGroupAssociations(), getExistingGroupAssociations()]).then(function(data) {
                    var newGroupAssociations = data[0];
                    var existingGroupAssociations = data[1];

                    var oldGroups = _.differenceBy(existingGroupAssociations, newGroupAssociations, "id");
                    var newGroups = _.differenceBy(newGroupAssociations, existingGroupAssociations, "id");

                    return {
                        "oldGroups": oldGroups,
                        "newGroups": newGroups
                    };
                });
            };

            var modifyGroups = function(groupsToModify) {
                var removeOrgUnits = function(orgUnitGroups) {
                    return _.map(orgUnitGroups, function(group) {
                        group.organisationUnits = _.map(group.organisationUnits, function(ou) {
                            if (_.containsBy(orgUnits, ou, "id"))
                                ou.localStatus = "DELETED";
                            return ou;
                        });
                        return group;
                    });
                };

                var addOrgUnits = function(orgUnitGroups) {
                    var orgUnitsToAdd = _.map(orgUnits, function(orgUnit) {
                        return {
                            'id': orgUnit.id,
                            'name': orgUnit.name,
                            'localStatus': 'NEW'
                        };
                    });

                    return _.map(orgUnitGroups, function(group) {
                        group.organisationUnits = group.organisationUnits ? group.organisationUnits : [];
                        group.organisationUnits = group.organisationUnits.concat(orgUnitsToAdd);
                        return group;
                    });
                };

                return removeOrgUnits(groupsToModify.oldGroups).concat(addOrgUnits(groupsToModify.newGroups));
            };

            var upsertOrgUnitGroups = function(orgUnitGroups) {
                return orgUnitGroupRepository.upsert(orgUnitGroups).then(function() {
                    return $hustle.publish({
                        "data": {
                            "orgUnitGroupIds": _.pluck(orgUnitGroups, "id"),
                            "orgUnitIds": _.pluck(orgUnits, "id")
                        },
                        "type": "upsertOrgUnitGroups",
                        "locale": $scope.locale,
                        "desc": $scope.resourceBundle.upsertOrgUnitGroupsDesc
                    }, "dataValues");
                });
            };

            return getOrgUnitGroups()
                .then(identifyGroupsToModify)
                .then(modifyGroups)
                .then(upsertOrgUnitGroups);
        };
    };
});
