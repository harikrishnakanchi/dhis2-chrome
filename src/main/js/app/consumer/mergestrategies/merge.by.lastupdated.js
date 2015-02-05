define(["lodashUtils", "moment"], function(_, moment) {
    return function(dataFromDHIS, dataFromIDB) {

        var lastUpdatedTimeIncludingAttributes = function(orgUnit) {
            var lastUpdated = _.pluck(orgUnit.attributeValues, "lastUpdated");
            lastUpdated.push(orgUnit.lastUpdated);
            return lastUpdated;
        };

        var isLocalDataStale = function() {
            if (!dataFromIDB) return true;
            return moment(dataFromDHIS.lastUpdated).isAfter(moment(dataFromIDB.lastUpdated));
        };

        if (isLocalDataStale()) {
            return dataFromDHIS;
        } else {
            return;
        }

    };
});
