define(["moment", "lodash", "mergeByLastUpdated"], function(moment, _, mergeByLastUpdated) {
    return function(orgUnitGroupService, orgUnitGroupRepository, changeLogRepository, $q) {
        this.run = function(message) {
            console.debug("Syncing org unit groups: ", message.data.data);
            var orgUnitGroups = _.isArray(message.data.data) ? message.data.data : [message.data.data];
            return download(orgUnitGroups).then(merge).then(function() {
                return changeLogRepository.upsert("orgUnitGroups", moment().toISOString());
            });
        };

        var download = function(orgUnitGroups) {
            var downloadLocallyChanged = function(orgUnitGroups) {
                if (_.isEmpty(orgUnitGroups))
                    return [];

                var orgUnitGroupIds = _.pluck(orgUnitGroups, "id");
                return orgUnitGroupService.get(orgUnitGroupIds).then(function(data) {
                    return data.data.organisationUnitGroups;
                });
            };

            var downloadRemotelyChanged = function() {
                return changeLogRepository.get("orgUnitGroups").then(function(lastUpdatedTime) {
                    return orgUnitGroupService.getAll(lastUpdatedTime).then(function(data) {
                        return data.data.organisationUnitGroups;
                    });
                });
            };

            return $q.all([downloadLocallyChanged(orgUnitGroups), downloadRemotelyChanged()]).then(function(data) {
                var locallyChanged = data[0];
                var remotelyChanged = data[1];

                return _.unionBy([locallyChanged, remotelyChanged], "id");
            });
        };

        var merge = function(orgUnitGroupsFromDHIS) {
            var syncPromises = _.map(orgUnitGroupsFromDHIS, function(ougFromDHIS) {
                return orgUnitGroupRepository.get(ougFromDHIS.id)
                    .then(_.curry(mergeByLastUpdated)(ougFromDHIS))
                    .then(function(data) {
                        return data ? orgUnitGroupRepository.upsert(ougFromDHIS) : $q.when({});
                    });
            });

            return $q.all(syncPromises);
        };
    };
});
