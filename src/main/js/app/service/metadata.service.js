define(["properties", "lodash"], function(properties, _) {
    return function($http, db) {
        var upsertMetadata = function(data) {
            _.each(properties.metadata.types, function(type) {
                var entities = data[type];
                var store = db.objectStore(type);
                if (!_.isEmpty(entities))
                    store.upsert(entities);
            });
            return updateChangeLog(data);
        };


        var getDataFromResponse = function(response) {
            return response.data;
        };

        var getMetadata = function(metadataChangeLog) {
            var lastUpdatedTimeQueryString = metadataChangeLog ? "?lastUpdated=" + metadataChangeLog.lastUpdatedTime : "";
            var url = properties.dhis.url + "/api/metaData" + lastUpdatedTimeQueryString;

            console.debug("Fetching " + url);
            return $http.get(url).then(getDataFromResponse);
        };

        var updateChangeLog = function(data) {
            var store = db.objectStore("changeLog");
            var createdDate = new Date(data.created);

            return store.upsert({
                type: 'metaData',
                lastUpdatedTime: createdDate.toISOString()
            });
        };

        var getLastUpdatedTime = function() {
            var store = db.objectStore("changeLog");
            return store.find('metaData');
        };

        var getTime = function(dateString) {
            return new Date(dateString).getTime();
        };

        var loadMetadata = function(metadataChangeLog) {
            return $http.get("/data/metadata.json").then(function(response) {
                var data = response.data;
                if (!(metadataChangeLog && metadataChangeLog.lastUpdatedTime) ||
                    (getTime(metadataChangeLog.lastUpdatedTime) < getTime(data.created)))
                    return upsertMetadata(data);
                return metadataChangeLog;
            });
        };
        var getSystemSettings = function() {
            var url = properties.dhis.url + "/api/systemSettings";
            console.debug("Fetching " + url);
            return $http.get(url).then(getDataFromResponse);
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
            var keys = _.keys(data);
            var entities = _.map(keys, function(key) {
                return {
                    "key": key,
                    "value": tryParseJson(data[key])
                };
            });
            console.debug("Storing ", type, entities.length);
            var store = db.objectStore(type);
            return store.upsert(entities);
        };

        var getTranslations = function() {
            var url = properties.dhis.url + "/api/translations";
            console.debug("Fetching " + url);
            return $http.get(url).then(getDataFromResponse);
        };

        var upsertTranslations = function(data) {
            console.debug("Processing translations ", data);
            var store = db.objectStore("translations");
            return store.upsert(data.translations);
        };

        this.loadMetadataFromFile = function() {
            getLastUpdatedTime().then(loadMetadata);
        };

        this.sync = function() {
            return getLastUpdatedTime()
                .then(getMetadata)
                .then(upsertMetadata)
                .then(getSystemSettings)
                .then(upsertSystemSettings)
                .then(getTranslations)
                .then(upsertTranslations)
                .then(function() {
                    console.log("Metadata sync complete");
                });
        };
    };
});