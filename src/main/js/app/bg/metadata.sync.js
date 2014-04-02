var msf = function() {
    var sync = function() {
        var db;

        $.ajaxPrefilter(function(options) {
            if (!options.beforeSend) {
                options.beforeSend = function(xhr) {
                    xhr.setRequestHeader('Authorization', properties.metadata.auth_header);
                };
            }
        });

        var getLastUpdatedTime = function() {
            var changeLogStore = db.transaction("changeLog", "readonly").objectStore("changeLog");
            var request = changeLogStore.get("metaData");
            var defer = Q.defer();
            request.onsuccess = function(e) {
                defer.resolve(e.target.result);
            };
            request.onerror = function(e) {
                defer.reject(e);
            };
            return defer.promise;
        };

        var openDb = function() {
            var request = window.indexedDB.open("msf");
            var defer = Q.defer();
            request.onsuccess = function(e) {
                db = e.target.result;
                defer.resolve(db);
            };
            request.onerror = function(e) {
                defer.reject(e);
            };
            return defer.promise;
        };

        var syncableTypes = ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections", "organisationUnits", "organisationUnitLevels"];
        var upsertMetadata = function(data) {
            var transaction = db.transaction(syncableTypes, "readwrite");
            _.each(syncableTypes, function(type) {
                var store = transaction.objectStore(type);
                var entities = data[type];
                _.each(entities, function(entity) {
                    store.put(entity);
                });
            });
        };

        var loadMetadata = function(metadataChangeLog) {
            var lastUpdatedTimeQueryString = metadataChangeLog ? "?lastUpdated=" + metadataChangeLog.lastUpdatedTime : "";
            var url = properties.metadata.url + lastUpdatedTimeQueryString;

            return httpGet(url, upsertMetadata);
        };

        var httpGet = function(url, onSuccess, onError) {
            var deferred = Q.defer();
            $.get(url).done(function(data) {
                onSuccess(data);
                deferred.resolve(data);
            }).fail(function(data) {
                console.log("Failed to fetch url: " + url);
                console.log(data);
                if (onError)
                    onError(data);
                deferred.reject(data);
            });

            return deferred.promise;
        };

        var updateChangeLog = function(data) {
            var store = db.transaction("changeLog", "readwrite").objectStore("changeLog");
            var createdDate = new Date(data.created);
            store.put({
                type: 'metaData',
                lastUpdatedTime: createdDate.toISOString()
            });
        };

        return openDb().then(getLastUpdatedTime).then(loadMetadata).then(updateChangeLog).then(function() {
            console.log("Metadata sync complete");
        });
    };

    return {
        "sync": sync
    };
}();

var registerCallback = function(alarmName, callback) {
    return function(alarm) {
        if (alarm.name === alarmName)
            callback();
    };
}

if (chrome.alarms)
    chrome.alarms.onAlarm.addListener(registerCallback("metadataSyncAlarm", msf.sync));