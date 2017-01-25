define([], function () {
    return function (db) {

        this.upsert = function (customAttributes) {
            var store = db.objectStore('customAttributes');
            return store.upsert(customAttributes);
        };

        this.getAll = function () {
            var store = db.objectStore('customAttributes');
            return store.getAll();
        };
    };
});