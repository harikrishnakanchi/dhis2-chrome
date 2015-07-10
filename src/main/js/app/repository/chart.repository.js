define([], function() {
    return function(db) {
        this.upsert = function(charts) {
            var store = db.objectStore("charts");
            return store.upsert(charts).then(function() {
                return charts;
            });
        };
    };
});