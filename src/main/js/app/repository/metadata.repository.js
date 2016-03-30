define(["properties", "lodash"], function(properties, _) {
    return function(db, $q) {
        this.upsertMetadata = function(data) {
            var upsertPromises = [];
            _.each(properties.metadata.types, function(type) {
                var entities = data[type];
                if(type === 'translations') {
                    _.each(entities, function (entity) {
                        if(entity.objectUid) {
                            entity.objectId = entity.objectUid;
                            delete entity.objectUid;
                        }
                    });
                }
                var store = db.objectStore(type);
                if (!_.isEmpty(entities))
                    upsertPromises.push(store.upsert(entities));
            });

            return $q.all(upsertPromises);
        };
    };
});
