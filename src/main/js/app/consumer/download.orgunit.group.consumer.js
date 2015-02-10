define(["moment", "lodash", "mergeBy"], function(moment, _, mergeBy) {
    return function(orgUnitGroupService, orgUnitGroupRepository, changeLogRepository, $q) {
        this.run = function(message) {
            var orgUnitGroups = _.isArray(message.data.data) ? message.data.data : [message.data.data];
            return download(orgUnitGroups)
                .then(mergeAndSave)
                .then(updateChangeLog);
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

        var mergeAndSave = function(orgUnitGroupsFromDHIS) {
            var orgUnitGroupIdsToMerge = _.pluck(orgUnitGroupsFromDHIS, "id");
            return orgUnitGroupRepository.findAll(orgUnitGroupIdsToMerge)
                .then(_.curry(mergeBy.lastUpdated)(orgUnitGroupsFromDHIS))
                .then(orgUnitGroupRepository.upsertDhisDownloadedData);
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert("orgUnitGroups", moment().toISOString());
        };
    };
});
