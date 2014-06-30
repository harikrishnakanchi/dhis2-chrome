define(["lodash"], function(_) {
    return function(db) {
        this.getAll = function() {
            var store = db.objectStore("dataSets");
            return store.getAll();
        };

        this.upsert = function(dataSets) {
            var store = db.objectStore("dataSets");
            return store.upsert(dataSets).then(function(id) {
                return dataSets;
            });
        };
    };
});