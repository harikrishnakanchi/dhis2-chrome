define(["properties"], function(properties) {
    return function(db, $http) {
        var syncableTypes = ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections", "organisationUnits", "organisationUnitLevels"];
        var upsertMetadata = function(data) {
            _.each(syncableTypes, function(type) {
                var entities = data[type];
                var store = db.objectStore(type);
                if (entities)
                    store.upsert(entities);
            });
            updateChangeLog(data);
        };

        var updateChangeLog = function(data) {
            var store = db.objectStore("changeLog");
            var createdDate = new Date(data.created);
            createdDate.setDate(createdDate.getDate() + 1);
            
            store.upsert({
                type: 'metaData',
                lastUpdatedTime: createdDate.toISOString()
            });
        };

        var getLastUpdatedTime = function() {
            var store = db.objectStore("changeLog")
            return store.find('metaData');
        };

        var loadMetaData = function(metadataChangeLog) {
            var url = properties.metadata.url
            if (metadataChangeLog)
            url += "?lastUpdated=" + metadataChangeLog.lastUpdatedTime;
            $http.get(url, {
                headers: {
                    'Authorization': properties.metadata.auth_header
                }
            }).success(upsertMetadata)
        };

        this.sync = function() {
            getLastUpdatedTime().then(loadMetaData);
        };
    };
});