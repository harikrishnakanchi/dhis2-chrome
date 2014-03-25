define(["properties", "lodash"], function(properties, _) {
    return function(db, $http) {
        var syncableTypes = ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections", "organisationUnits", "organisationUnitLevels"];
        var upsertMetadata = function(data) {
            _.each(syncableTypes, function(type) {
                var entities = data[type];
                var store = db.objectStore(type);
                if (!_.isEmpty(entities))
                    store.upsert(entities);
            });
            return updateChangeLog(data);
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
            var store = db.objectStore("changeLog")
            return store.find('metaData');
        };

        var loadMetaDataFromServer = function(metadataChangeLog) {
            var url = properties.metadata.url;
            if (metadataChangeLog)
                url += "?lastUpdated=" + metadataChangeLog.lastUpdatedTime;
            $http.get(url, {
                headers: {
                    'Authorization': properties.metadata.auth_header
                }
            }).success(upsertMetadata)
        };

        var getTime = function(dateString) {
            return new Date(dateString).getTime();
        };

        var loadMetaDataFromFile = function(metadataChangeLog) {
            return $http.get("/data/metadata.json").then(function(response) {
                var data = response.data;
                if (!(metadataChangeLog && metadataChangeLog.lastUpdatedTime) || (getTime(metadataChangeLog.lastUpdatedTime) < getTime(data.created)))
                    return upsertMetadata(data);
                return metadataChangeLog;
            });
        };

        this.sync = function() {
            getLastUpdatedTime().then(loadMetaDataFromFile).then(loadMetaDataFromServer);
        };
    };
});