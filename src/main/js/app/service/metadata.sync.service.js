define(["properties"], function(properties) {
    return function(db, $http) {

        var upsertMetadata = function(data) {
            _.each(properties.syncable_types, function(type) {
                var entities = data[type];
                var store = db.objectStore(type);
                _.each(entities, function(entity) {
                    store.upsert(entity);
                });
            });
        };

        this.sync = function() {
            $http.get(properties.metadata.url, {
                headers: {
                    'Authorization': properties.metadata.auth_header
                }
            }).success(upsertMetadata);
        };
    };
});