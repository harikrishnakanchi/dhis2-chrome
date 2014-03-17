define(["properties"], function(properties) {
    return function(db, $http) {
        const syncable_types = ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections"];

        var upsertMetadata = function(data) {
            _.each(syncable_types, function(type) {
                var entities = data[type];
                var store = db.objectStore(type);
                _.each(entities, function(entity) {
                    store.upsert(entity);
                });
            });
        };

        this.sync = function() {
            $http.get(properties.metadata_url, {
                headers: {
                    'Authorization': properties.metadata_auth_header
                }
            }).success(upsertMetadata);
        };
    };
});