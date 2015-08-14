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

        var findAll = function(opUnitIds) {
            var store = db.objectStore(storeName);
            var query = db.queryBuilder().$in(opUnitIds).compile();
            return store.each(query);
        };

        return {
            "get": get,
            "upsert": upsert,
            "findAll": findAll
        };
    };
});