define(['moment', "lodashUtils", "dateUtils"], function(moment, _, dateUtils) {
    return function(orgUnitService, orgUnitRepository, changeLogRepository, $q) {

        this.run = function(message) {
            console.debug("Syncing org unit: ", message.data.data);
            var orgUnits = _.isArray(message.data.data) ? message.data.data : [message.data.data];
            return download(orgUnits).then(merge).then(updateChangeLog);
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert("orgUnits", moment().toISOString());
        };

        var download = function(orgUnits) {
            var downloadLocallyChanged = function(orgUnits) {
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

            return $q.all([downloadLocallyChanged(orgUnits), downloadRemotelyChanged()]).then(function(data) {
                var locallyChanged = data[0];
                var remotelyChanged = data[1];

                return _.unionBy([locallyChanged, remotelyChanged], "id");
            });
        };

        var merge = function(orgUnitsFromDHIS) {
            var lastUpdatedTimeIncludingAttributes = function(orgUnit) {
                var lastUpdated = _.pluck(orgUnit.attributeValues, "lastUpdated");
                lastUpdated.push(orgUnit.lastUpdated);
                return lastUpdated;
            };

            var isLocalDataStale = function(ouFromDHIS, ouFromIDB) {
                var networkDelay = 1;
                if (!ouFromIDB) return true;
                var lastUpdatedInDhis = dateUtils.max(lastUpdatedTimeIncludingAttributes(ouFromDHIS));
                var lastUpdatedInIDB = dateUtils.max(lastUpdatedTimeIncludingAttributes(ouFromIDB));
                lastUpdatedInIDB = lastUpdatedInIDB.add(networkDelay, "minutes");
                return lastUpdatedInDhis.isAfter(lastUpdatedInIDB);
            };

            var syncPromises = _.map(orgUnitsFromDHIS, function(ouFromDHIS) {
                return orgUnitRepository.getOrgUnit(ouFromDHIS.id).then(function(ouFromIDB) {
                    if (isLocalDataStale(ouFromDHIS, ouFromIDB)) {
                        console.debug("upserting orgnization : id " + ouFromDHIS.id + " name : " + ouFromDHIS.name);
                        return orgUnitRepository.upsert(ouFromDHIS);
                    } else {
                        return $q.when({});
                    }
                });
            });

            return $q.all(syncPromises);
        };
    };
});
