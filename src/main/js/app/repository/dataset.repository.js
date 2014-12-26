define(["lodash"], function(_) {
    return function(db) {
        var getAll = function() {
            var store = db.objectStore("dataSets");
            return store.getAll();
        };

        var getAllDatasetIds = function() {
            return getAll().then(function(data) {
                return _.pluck(data, "id");
            });
        };

        var upsert = function(dataSets) {
            var store = db.objectStore("dataSets");
            return store.upsert(dataSets).then(function(id) {
                return dataSets;
            });
        };

        return {
            "getAll": getAll,
            "getAllDatasetIds": getAllDatasetIds,
            "upsert": upsert
        };
    };
});