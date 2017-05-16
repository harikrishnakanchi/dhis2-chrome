define(["lodash"], function(_) {
    return function(db, $q) {
        var storeName = "excludedDataElements";

        this.upsert = function(excludedDataElements) {
            var store = db.objectStore(storeName);
            return store.upsert(excludedDataElements);
        };

        this.get = function(moduleId) {
            var store = db.objectStore(storeName);
            return store.find(moduleId);
        };

        this.findAll = function (moduleIds) {
            var store = db.objectStore(storeName);
            var query = db.queryBuilder().$in(moduleIds).compile();
            return store.each(query);
        };
    };
});
