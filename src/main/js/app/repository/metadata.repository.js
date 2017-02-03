define(["properties", "lodash", "metadataConf"], function(properties, _, metadataConf) {
    return function(db, $q) {
        this.upsertMetadata = function(data) {
            var upsertPromises = [];
            _.each(_.keys(metadataConf.types), function(type) {
                var entities = data[type];
                var store = db.objectStore(type);
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
