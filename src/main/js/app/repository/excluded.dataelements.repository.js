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
    };
});
