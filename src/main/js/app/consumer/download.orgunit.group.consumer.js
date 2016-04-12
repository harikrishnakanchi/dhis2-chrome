define(["moment", "lodash"], function(moment, _) {
    return function(orgUnitGroupService, orgUnitGroupRepository, changeLogRepository) {
        this.run = function(message) {
            return download()
                .then(mergeAndSave)
                .then(updateChangeLog);
        };

        var download = function() {
            return changeLogRepository.get("orgUnitGroups").then(function(lastUpdatedTime) {
                return orgUnitGroupService.getAll(lastUpdatedTime);
            });
        };

        var mergeAndSave = function(orgUnitGroupsFromDHIS) {
            var mergeOrgUnits = function(remoteOrgUnits, localOrgUnits) {
                var partitionedLocalOrgUnits = _.partition(localOrgUnits, function(orgUnit) {
                    return orgUnit.localStatus !== undefined;
                });

                var locallyModifiedOrgUnits = partitionedLocalOrgUnits[0];
                var otherLocalOrgUnits = partitionedLocalOrgUnits[1];

                var otherRemoteOrgUnits = _.reject(remoteOrgUnits, function(orgUnit) {
                    return _.containsBy(locallyModifiedOrgUnits, orgUnit, "id");
                });

                return otherRemoteOrgUnits.concat(locallyModifiedOrgUnits);
            };

            var mergeOrgUnitGroups = function(remoteOrgUnitGroups, localOrgUnitGroups) {
                return _.map(remoteOrgUnitGroups, function(remoteOrgUnitGroup) {
                    var localOrgUnitGroup = _.find(localOrgUnitGroups, "id", remoteOrgUnitGroup.id);
                    if (localOrgUnitGroup) {
                        remoteOrgUnitGroup.organisationUnits = mergeOrgUnits(remoteOrgUnitGroup.organisationUnits, localOrgUnitGroup.organisationUnits);
                    }
                    return remoteOrgUnitGroup;
                });
            };

            var orgUnitGroupIdsToMerge = _.pluck(orgUnitGroupsFromDHIS, "id");
            return orgUnitGroupRepository.findAll(orgUnitGroupIdsToMerge)
                .then(_.curry(mergeOrgUnitGroups)(orgUnitGroupsFromDHIS))
                .then(orgUnitGroupRepository.upsertDhisDownloadedData);
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert("orgUnitGroups", moment().toISOString());
        };
    };
});
