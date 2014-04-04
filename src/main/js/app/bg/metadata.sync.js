var msf = msf || {};
msf.metadata = function() {
    var sync = function() {
        var openDb = function() {
            return idb.openDb("msf");
        };

        var getLastUpdatedTime = function() {
            return idb.get("changeLog", "metaData");
        };

        var getMetadata = function(metadataChangeLog) {
            var lastUpdatedTimeQueryString = metadataChangeLog ? "?lastUpdated=" + metadataChangeLog.lastUpdatedTime : "";
            var url = properties.metadata.url + lastUpdatedTimeQueryString;

            return httpWrapper.get(url);
        };

        var upsertMetadata = function(data) {
            var syncableTypes = properties.metadata.types;
            var putData = function(transaction) {
                var putRequests = [];
                _.each(syncableTypes, function(type) {
                    var entities = data[type];
                    _.each(entities, function(entity) {
                        var putRequest = idb.put(type, entity, transaction);
                        putRequests.push(putRequest);
                    });
                });
                return Q.all(putRequests).then(function() {
                    return data;
                });
            };

            return idb.usingTransaction(syncableTypes, putData);
        };

        var updateChangeLog = function(data) {
            var createdDate = new Date(data.created);
            return idb.put("changeLog", {
                type: 'metaData',
                lastUpdatedTime: createdDate.toISOString()
            });
        };

        return openDb().then(getLastUpdatedTime).then(getMetadata).then(upsertMetadata).then(updateChangeLog).then(function() {
            console.log("Metadata sync complete");
        });
    };

    return {
        "sync": sync
    };
}();

(function() {
    var registerCallback = function(alarmName, callback) {
        return function(alarm) {
            if (alarm.name === alarmName)
                callback();
        };
    };

    if (chrome.alarms)
        chrome.alarms.onAlarm.addListener(registerCallback("metadataSyncAlarm", msf.metadata.sync));
})();