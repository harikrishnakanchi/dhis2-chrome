define(['moment', "lodashUtils", "dateUtils"], function(moment, _, dateUtils) {
    return function(orgUnitService, systemInfoService, orgUnitRepository, changeLogRepository, $q, mergeBy) {
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

            var downloadRemotelyChanged = function() {
                return changeLogRepository.get("orgUnits").then(function(lastUpdatedTime) {
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
            return changeLogRepository.upsert("orgUnits", serverDate);
        };
    };
});
