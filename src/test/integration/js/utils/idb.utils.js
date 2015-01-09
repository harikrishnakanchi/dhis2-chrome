define([], function() {
    var db = dhis.injector.get("$indexedDB");

    var upsert = function(storeName, data) {
        var store = db.objectStore(storeName);
        return store.upsert(data);
    };

    var clear = function(storeName) {
        var store = db.objectStore(storeName);
        return store.clear();
    };

    var deleteRecord = function(storeName, key) {
        var store = db.objectStore(storeName);
        return store.delete(key);
    };

    var get = function(storeName, key) {
        var store = db.objectStore(storeName);
        return store.find(key);
    };

    return {
        "upsert": upsert,
        "clear": clear,
        "deleteRecord": deleteRecord,
        "get": get
    };
});
