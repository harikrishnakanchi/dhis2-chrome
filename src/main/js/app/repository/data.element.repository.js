define(["lodash"], function (_) {
    return function (db) {
        var store = db.objectStore("dataElements");

        this.getAll = function () {
            return store.getAll();
        };

        this.get = function (dataElementId) {
            return store.find(dataElementId);
        };

        this.findAll = function (dataElementIds) {
            var query = db.queryBuilder().$in(dataElementIds).compile();
            return store.each(query);
        };
    };
});
