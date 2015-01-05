define(["properties", "dhisUrl", "lodash"], function(properties, dhisUrl, _) {
    return function($http, db, $q) {
        var upsertMetadata = function(data) {
            var upsertPromises = [];
            _.each(properties.metadata.types, function(type) {
                var entities = data[type];
                var store = db.objectStore(type);
                if (!_.isEmpty(entities))
                    upsertPromises.push(store.upsert(entities));
            });

            upsertPromises.push(upsertProgramData(data));

            return $q.all(upsertPromises).then(function() {
                return updateChangeLog(data);
            });
        };

        var upsertProgramData = function(data) {
            if (!_.isEmpty(data.programs)) {
                var programs = _.transform(data.programs, function(acc, ele) {
                    if (!_.isEmpty(ele.organisationUnits))
                        ele.orgUnitIds = _.pluck(ele.organisationUnits, 'id');
                    acc.push(ele);
                });
                var store = db.objectStore("programs");
                return store.upsert(programs);
            }
        };

        var getDataFromResponse = function(response, filterFields) {
            filterFields = filterFields || [];
            var data = response.data;
            _.forEach(filterFields, function(f) {
                delete data[f];
            });
            return data;
        };

        var getMetadata = function(metadataChangeLog) {
            var lastUpdatedTimeQueryString = metadataChangeLog ? "?lastUpdated=" + metadataChangeLog.lastUpdatedTime : "";
            var url = dhisUrl.metadata + lastUpdatedTimeQueryString;

            console.debug("Fetching " + url);
            return $http.get(url).then(function(data) {
                return getDataFromResponse(data, ["organisationUnits", "organisationUnitGroups"]);
            });
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
                    return upsertMetadata(data)
                        .then(getLocalOrgUnits)
                        .then(upsertOrgUnits)
                        .then(getLocalSystemSettings)
                        .then(upsertSystemSettings)
                        .then(getLocalTranslations)
                        .then(upsertTranslations);
                return metadataChangeLog;
            });
        };

        var getSystemSettings = function() {
            var url = dhisUrl.systemSettings;
            console.debug("Fetching " + url);
            return $http.get(url).then(getDataFromResponse);
        };

        var getLocalSystemSettings = function() {
            console.debug("Fetching /data/systemSettings.json");
            return $http.get("/data/systemSettings.json").then(getDataFromResponse);
        };

        var getLocalTranslations = function() {
            console.debug("Fetching /data/translations.json");
            return $http.get("/data/translations.json").then(getDataFromResponse);
        };

        var getLocalOrgUnits = function() {
            console.debug("Fetching /data/organisationUnits.json");
            return $http.get("/data/organisationUnits.json").then(getDataFromResponse);
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
            var url = dhisUrl.translations;
            console.debug("Fetching " + url);
            return $http.get(url).then(getDataFromResponse);
        };

        var upsertTranslations = function(data) {
            console.debug("Processing translations ", data);
            var store = db.objectStore("translations");
            return store.upsert(data.translations);
        };

        var upsertOrgUnits = function(data) {
            console.debug("Processing organisationUnits ", data);
            var store = db.objectStore("organisationUnits");
            return store.upsert(data.organisationUnits);
        };

        this.loadMetadataFromFile = function() {
            return getLastUpdatedTime()
                .then(loadMetadata);
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
