define(["properties", "lodash"], function(properties, _) {
    return function(db, $http) {
        var upsertMetadata = function(data) {
            _.each(properties.metadata.types, function(type) {
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

        var getTime = function(dateString) {
            return new Date(dateString).getTime();
        };

        var loadMetaDataFromFile = function(metadataChangeLog) {
            return $http.get("/data/metadata.json").then(function(response) {
                var data = response.data;
                if (!(metadataChangeLog && metadataChangeLog.lastUpdatedTime) ||
                    (getTime(metadataChangeLog.lastUpdatedTime) < getTime(data.created)))
                    return upsertMetadata(data);
                return metadataChangeLog;
            });
        };

        this.loadMetadata = function() {
            getLastUpdatedTime().then(loadMetaDataFromFile);
        };
    };
});