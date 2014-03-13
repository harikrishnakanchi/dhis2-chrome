define([], function() {
    var add_object_stores = function(db) {
        var store = db.createObjectStore("organization", {
            keyPath: "name"
        });
        return store.transaction;
    };

    return {
        'add_object_stores': add_object_stores
    };
});