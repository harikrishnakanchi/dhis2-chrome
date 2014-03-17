define([], function() {
    var add_object_stores = function(db, tx) {
        const syncable_types = ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections"];
        _.each(syncable_types, function(type) {
            db.createObjectStore(type, {
                keyPath: "id"
            });
        });
    };

    var add_index_on_datasets_for_sections = function(db, tx) {
        var store = tx.objectStore("sections");
        store.createIndex("dataSet.id", "dataSet.id", {
            unique: false
        });
    };

    return [add_object_stores, add_index_on_datasets_for_sections];
});