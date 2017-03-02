define(["moment", "lodash"], function(moment, _) {
    return function(orgUnitGroupService, systemInfoService, orgUnitGroupRepository, changeLogRepository) {
        this.run = function(message) {
            return getServerTime()
                .then(download)
                .then(mergeAndSave)
                .then(updateChangeLog);
        };

        var getServerTime = function () {
            return systemInfoService.getServerDate().then(function (serverTime) {
                return { downloadStartTime: serverTime };
            });
        };

        var download = function(data) {
            return changeLogRepository.get("organisationUnitGroups").then(function(lastUpdatedTime) {
                return orgUnitGroupService.getAll(lastUpdatedTime).then(function (orgUnitGroups) {
                    return _.merge({ orgUnitGroups: orgUnitGroups }, data);
                });
            });
        };

        var mergeAndSave = function(data) {
            var mergeOrgUnits = function(remoteOrgUnits, localOrgUnits) {
                var partitionedLocalOrgUnits = _.partition(localOrgUnits, function(orgUnit) {
                    return orgUnit.localStatus !== undefined;
                });

                var locallyModifiedOrgUnits = partitionedLocalOrgUnits[0];

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

            var orgUnitGroupIdsToMerge = _.pluck(data.orgUnitGroups, "id");
            return orgUnitGroupRepository.findAll(orgUnitGroupIdsToMerge)
                .then(_.curry(mergeOrgUnitGroups)(data.orgUnitGroups))
                .then(orgUnitGroupRepository.upsertDhisDownloadedData)
                .then(function(){ return data; });
        };

        var updateChangeLog = function(data) {
            return changeLogRepository.upsert("organisationUnitGroups", data.downloadStartTime);
        };
    };
});
