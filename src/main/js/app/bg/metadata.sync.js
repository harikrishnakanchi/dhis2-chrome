define(["idb", "httpWrapper", "Q", "lodash", "properties"], function(idb, httpWrapper, Q, _, properties) {
    var sync = function() {
        var openDb = function() {
            return idb.openDb("msf");
        };

        var getLastUpdatedTime = function() {
            return idb.get("changeLog", "metaData");
        };

        var getMetadata = function(metadataChangeLog) {
            var lastUpdatedTimeQueryString = metadataChangeLog ? "?lastUpdated=" + metadataChangeLog.lastUpdatedTime : "";
            var url = properties.dhis.url + "/api/metaData" + lastUpdatedTimeQueryString;

            console.debug("Fetching " + url);
            return httpWrapper.get(url);
        };

        var upsertMetadata = function(data) {
            console.debug("Processing metadata ", data);
            var syncableTypes = properties.metadata.types;
            var putData = function(transaction) {
                var putRequests = [];
                _.each(syncableTypes, function(type) {
                    var entities = data[type] || [];
                    console.debug("Storing ", type, entities.length);
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

        var getSystemSettings = function() {
            var url = properties.dhis.url + "/api/systemSettings";
            console.debug("Fetching " + url);
            return httpWrapper.get(url);
        };

        var tryParseJson = function(val) {
            if (typeof(val) != "string") return val;
            try {
                return JSON.parse(val);
            } catch (e) {
                return val;
            }
        };

        var upsertSystemSettings = function(data) {
            console.debug("Processing system settings ", data);
            var type = "systemSettings";
            var putData = function(transaction) {
                var keys = _.keys(data);
                var entities = _.map(keys, function(key) {
                    return {
                        "key": key,
                        "value": tryParseJson(data[key])
                    };
                });
                console.debug("Storing ", type, entities.length);
                _.each(entities, function(entity) {
                    var putRequest = idb.put(type, entity, transaction);
                    return putRequest.then(function() {
                        return data;
                    });
                });
            };

            return idb.usingTransaction(type, putData);
        };

        var updateChangeLog = function(data) {
            var createdDate = new Date(data.created);
            return idb.put("changeLog", {
                type: 'metaData',
                lastUpdatedTime: createdDate.toISOString()
            });
        };

        var getTranslations = function() {
            var url = properties.dhis.url + "/api/translations";
            console.debug("Fetching " + url);
            return httpWrapper.get(url);
        };

        var upsertTranslations = function(data) {
            console.debug("Processing translations ", data);
            var type = "translations";
            var translations = data.translations;
            var putData = function(transaction) {
                console.debug("Storing ", type, translations.length);
                _.each(translations, function(translation) {
                    var putRequest = idb.put(type, translation, transaction);
                    return putRequest.then(function() {
                        return translation;
                    });
                });
            };

            return idb.usingTransaction(type, putData);
        };

        return openDb()
            .then(getLastUpdatedTime)
            .then(getMetadata)
            .then(upsertMetadata)
            .then(updateChangeLog)
            .then(getSystemSettings)
            .then(upsertSystemSettings)
            .then(getTranslations)
            .then(upsertTranslations)
            .then(function() {
                console.log("Metadata sync complete");
            });
    };

    return {
        "sync": sync
    };
});