define(["moment", "lodash"], function(moment, _) {
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
            var isLocalDataStale = function(ougFromDHIS, ougFromIDB) {
                if (!ougFromIDB) return true;
                var lastUpdatedInDhis = moment(ougFromDHIS.lastUpdated);
                var lastUpdatedInIDB = moment(ougFromIDB.lastUpdated);
                return lastUpdatedInDhis.isAfter(lastUpdatedInIDB)
            };
            var syncPromises = _.map(orgUnitGroupsFromDHIS, function(ougFromDHIS) {
                return orgUnitGroupRepository.get(ougFromDHIS.id).then(function(ougFromIDB) {
                    if (isLocalDataStale(ougFromDHIS, ougFromIDB)) {
                        console.error("upserting orgunitgroup : id " + ougFromDHIS.id + " name : " + ougFromDHIS.name);
                        return orgUnitGroupRepository.upsert(ougFromDHIS);
                    } else {
                        $q.when({});
                    }
                });
            });

            return $q.all(syncPromises);
        };
    };
});
