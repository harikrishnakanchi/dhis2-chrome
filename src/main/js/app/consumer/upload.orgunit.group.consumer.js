define(["lodash"], function(_) {
    return function(orgUnitGroupService, orgUnitGroupRepository, $q) {
        var retrieveOrgUnitGroupsFromDb = function(orgUnitGroupIds) {
            return orgUnitGroupRepository.findAll(orgUnitGroupIds);
        };

        var updateOrgUnitGroupsInDHIS = function(orgUnitGroups, orgUnitIds) {
            return _.reduce(orgUnitGroups, function (wholePromise, orgUnitGroup) {
                return _.reduce(orgUnitGroup.organisationUnits, function (eachPromise, orgUnit) {
                    if(_.contains(orgUnitIds, orgUnit.id)) {
                        return eachPromise.then(function () {
                            if (orgUnit.localStatus === "NEW")
                                return orgUnitGroupService.addOrgUnit(orgUnitGroup.id, orgUnit.id)
                                    .then(_.partial(clearLocalStatus, orgUnitGroup.id, orgUnit.id));
                            else if (orgUnit.localStatus === "DELETED")
                                return orgUnitGroupService.deleteOrgUnit(orgUnitGroup.id, orgUnit.id)
                                    .then(_.partial(clearLocalStatus, orgUnitGroup.id, orgUnit.id))
                                    .catch(function(response) {
                                        if(response.status === 404) {
                                            return clearLocalStatus(orgUnitGroup.id, orgUnit.id);
                                        } else {
                                            return $q.reject(response);
                                        }
                                    });
                            else
                                return eachPromise;
                        });
                    } else {
                        return eachPromise;
                    }
                }, wholePromise);
            }, $q.when());
        };

        var clearLocalStatus = function(orgUnitGroupId, orgUnitId) {
            return orgUnitGroupRepository.clearStatusFlag(orgUnitGroupId, orgUnitId);
        };

        this.run = function(message) {
            var orgUnitGroupIds = message.data.data.orgUnitGroupIds;
            var orgUnitIds = message.data.data.orgUnitIds;

            return retrieveOrgUnitGroupsFromDb(orgUnitGroupIds)
                .then(_.partial(updateOrgUnitGroupsInDHIS, _, orgUnitIds));
        };
    };
});
