define(['moment', "lodashUtils", "dateUtils", "mergeByLastUpdated"], function(moment, _, dateUtils, mergeByLastUpdated) {
    return function(orgUnitService, orgUnitRepository, changeLogRepository, $q) {

        this.run = function(message) {
            var orgUnits = _.isArray(message.data.data) ? message.data.data : [message.data.data];
            return download(orgUnits)
                .then(mergeAndSave)
                .then(updateChangeLog);
        };

        var download = function(orgUnits) {
            var downloadDhisCopyOfLocallyChangedOrgUnits = function(orgUnits) {
                if (_.isEmpty(orgUnits))
                    return [];

                var orgUnitIds = _.pluck(orgUnits, "id");
                return orgUnitService.get(orgUnitIds).then(function(data) {
                    return data.data.organisationUnits;
                });
            };

            var downloadRemotelyChanged = function() {
                return changeLogRepository.get("orgUnits").then(function(lastUpdatedTime) {
                    return orgUnitService.getAll(lastUpdatedTime).then(function(data) {
                        return data.data.organisationUnits;
                    });
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
                .then(_.curry(mergeByLastUpdated)(undefined, orgUnitsFromDHIS))
                .then(orgUnitRepository.upsertDhisDownloadedData);
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert("orgUnits", moment().toISOString());
        };
    };
});
