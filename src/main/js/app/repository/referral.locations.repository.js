define(["lodash"], function(_) {
    return function(db, $q) {
        var storeName = "referralLocations";

        var upsert = function(payload){
            var store = db.objectStore(storeName);
            return store.upsert(payload);
        };

        var get = function(opUnitId) {
            if (!opUnitId) return $q.when([]);
            var store = db.objectStore(storeName);
            return store.find(opUnitId);
        };

        return {
            "get": get,
            "upsert": upsert
        };
    };
});