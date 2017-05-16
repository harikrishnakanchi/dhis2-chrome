define([], function() {
    return function($hustle, $q, $scope, orgUnitRepository, orgUnitGroupRepository) {

        this.associateOrgunitsToGroups = function(orgUnits, existingOrgUnitGroupIds, newOrgUnitGroupIds) {
            var identifyGroupsToModify = function() {
                var getOrgunitGroups = function(orgUnitGroupIds) {
                    return orgUnitGroupRepository.findAll(orgUnitGroupIds);
                };

                return $q.all([getOrgunitGroups(existingOrgUnitGroupIds), getOrgunitGroups(newOrgUnitGroupIds)]).then(function(data) {
                    var existingGroupAssociations = data[0];
                    var newGroupAssociations = data[1];

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

            return identifyGroupsToModify()
                .then(modifyGroups)
                .then(upsertOrgUnitGroups);
        };

        this.associateModuleAndOriginsToGroups = function (orgUnits) {
            var getOrgunitGroups = function (orgUnitGroupIds) {
                return orgUnitGroupRepository.findAll(orgUnitGroupIds);
            };

            var addOrgUnits = function (orgUnitGroups) {
                var orgUnitsToAdd = _.map(orgUnits, function(orgUnit) {
                    return {
                        'id': orgUnit.id,
                        'name': orgUnit.name,
                        'localStatus': 'NEW'
                    };
                });

                return _.map(orgUnitGroups, function (group) {
                    group.organisationUnits = group.organisationUnits ? group.organisationUnits : [];
                    group.organisationUnits = group.organisationUnits.concat(orgUnitsToAdd);
                    return group;
                });
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

            return orgUnitRepository.getAssociatedOrganisationUnitGroups(_.first(orgUnits).id)
                .then(getOrgunitGroups)
                .then(addOrgUnits)
                .then(upsertOrgUnitGroups);
        };
    };
});
