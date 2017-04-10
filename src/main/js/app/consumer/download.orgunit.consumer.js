define(['moment', "lodashUtils", "dateUtils"], function(moment, _, dateUtils) {
    return function(orgUnitService, systemInfoService, orgUnitRepository, changeLogRepository, $q, mergeBy, systemSettingRepository) {
        var serverDate;

        this.run = function(message) {
            var orgUnits = _.isArray(message.data.data) ? message.data.data : [message.data.data];
            return getServerDate()
                .then(_.partial(download, orgUnits))
                .then(mergeAndSave)
                .then(updateChangeLog);
        };

        var getServerDate = function () {
            return systemInfoService.getServerDate().then(function (date) {
                serverDate = date;
            });
        };

        var download = function(orgUnits) {
            var downloadDhisCopyOfLocallyChangedOrgUnits = function(orgUnits) {
                if (_.isEmpty(orgUnits))
                    return [];

                var orgUnitIds = _.pluck(orgUnits, "id");
                return orgUnitService.get(orgUnitIds);
            };

            var downloadOrgUnitTree = function (orgUnitId, orgUnitAccumulator) {
                var changeLogKey = "organisationUnits:" + orgUnitId;
                return changeLogRepository.get(changeLogKey)
                    .then(_.partial(orgUnitService.getOrgUnitTree, orgUnitId))
                    .then(function (updatedOrgUnits) {
                        updatedOrgUnits = updatedOrgUnits || [];
                        return orgUnitAccumulator.concat(updatedOrgUnits);
                    });
            };

            var downloadRemotelyChanged = function() {
                var productKeyLevel = systemSettingRepository.getProductKeyLevel();
                var allowedOrgUnitIds = _.map(systemSettingRepository.getAllowedOrgUnits() || [], 'id');
                if (productKeyLevel != 'global') {
                    return _.reduce(allowedOrgUnitIds, function (result, orgUnitId) {
                        return result.then(_.partial(downloadOrgUnitTree, orgUnitId));
                    }, $q.when([]));
                }
                return changeLogRepository.get("organisationUnits").then(function(lastUpdatedTime) {
                    return orgUnitService.getAll(lastUpdatedTime);
                });
            };

            return $q.all([downloadDhisCopyOfLocallyChangedOrgUnits(orgUnits), downloadRemotelyChanged()]).then(function(data) {
                var locallyChanged = data[0];
                var remotelyChanged = data[1];

                return _.unionBy([locallyChanged, remotelyChanged], "id");
            });
        };

        var mergeAndSave = function(orgUnitsFromDHIS) {
            var orgUnitIdsToMerge = _.pluck(orgUnitsFromDHIS, "id");
            return orgUnitRepository.findAll(orgUnitIdsToMerge)
                .then(_.curry(mergeBy.lastUpdated)({}, orgUnitsFromDHIS))
                .then(orgUnitRepository.upsertDhisDownloadedData);
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert("organisationUnits", serverDate);
        };
    };
});
