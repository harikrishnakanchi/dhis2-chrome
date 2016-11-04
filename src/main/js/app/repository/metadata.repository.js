define(["properties", "lodash"], function(properties, _) {
    return function(db, $q) {
        this.upsertMetadata = function(data) {
            var upsertPromises = [];
            _.each(properties.metadata.types, function(type) {
                var entities = data[type];
                var store = db.objectStore(type);
                if (!_.isEmpty(entities))
                    upsertPromises.push(store.upsert(entities));
            });

            return $q.all(upsertPromises);
        };
    };
});
