define([], function () {
    return function (db) {
        this.getAll = function () {
            var store = db.objectStore('attributes');
            return store.getAll();
        };
    };
});
