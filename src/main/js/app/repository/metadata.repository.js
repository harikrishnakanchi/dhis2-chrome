define(["properties", "lodash", "metadataConf"], function(properties, _, metadataConf) {
    return function(db, $q) {
        this.upsertMetadata = function(data) {
            var upsertPromises = [];
            _.each(metadataConf.entities, function(entity) {
                var entities = data[entity];
                var store = db.objectStore(entity);
                if (!_.isEmpty(entities))
                    upsertPromises.push(store.upsert(entities));
            });

            return $q.all(upsertPromises);
        };

        this.upsertMetadataForEntity = function (data, type) {
            var store = db.objectStore(type);
            return store.upsert(data);
        };
    };
});
