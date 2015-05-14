define(["lodash"], function(_) {
    return function(orgUnitGroupService, orgUnitGroupRepository, $q) {
        var retrieveOrgUnitGroupsFromDb = function(orgUnitGroupIds) {
            return orgUnitGroupRepository.findAll(orgUnitGroupIds);
        };

        var generatePayload = function(orgUnitGroups, orgUnitIds) {
            return _.map(orgUnitGroups, function(group) {
                group.organisationUnits = _.transform(group.organisationUnits, function(acc, orgUnit) {
                    if (orgUnit.localStatus === "NEW" && !_.contains(orgUnitIds, orgUnit.id))
                        return;
                    if (orgUnit.localStatus === "DELETED" && _.contains(orgUnitIds, orgUnit.id))
                        return;
                    orgUnit = _.omit(orgUnit, "localStatus");
                    acc.push(orgUnit);
                }, []);
                return group;
            });
        };

        var clearLocalStatus = function(orgUnitGroupIds, orgUnitIds) {
            return $q.all(_.map(orgUnitGroupIds, function(groupId) {
                return orgUnitGroupRepository.clearStatusFlag(groupId, orgUnitIds);
            }));
        };

        this.run = function(message) {
            var orgUnitGroupIds = message.data.data.orgUnitGroupIds;
            var orgUnitIds = message.data.data.orgUnitIds;

            return retrieveOrgUnitGroupsFromDb(orgUnitGroupIds)
                .then(_.curry(generatePayload)(_, orgUnitIds))
                .then(orgUnitGroupService.upsert)
                .then(_.partial(clearLocalStatus, orgUnitGroupIds, orgUnitIds));
        };
    };
});
