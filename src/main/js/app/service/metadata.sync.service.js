define([], function() {
    return function(db) {
        const syncable_types = ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections"];
        this.sync = function(data) {
            _.each(syncable_types, function(type) {
                var entities = data[type];
                var store = db.objectStore(type);
                _.each(entities, function(entity) {
                    store.upsert(entity);
                });
            });
        };
    };
});