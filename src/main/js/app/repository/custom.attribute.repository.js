define([], function () {
    return function (db) {
        var store = db.objectStore('customAttributes');
        this.upsert = function (customAttributes) {
            return store.upsert(customAttributes);
        };

        this.getAll = function () {
            return store.getAll();
        };
    };
});