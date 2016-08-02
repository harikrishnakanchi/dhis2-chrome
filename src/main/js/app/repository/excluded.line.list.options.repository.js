define([], function () {
    return function (db) {
        var excludedLineListOptionsStore = 'excludedLineListOptions';

        this.get = function (moduleId) {
            var store = db.objectStore(excludedLineListOptionsStore);
            return store.find(moduleId);
        };

        this.upsert = function (payLoad) {
            var store = db.objectStore(excludedLineListOptionsStore);
            return store.upsert(payLoad);
        };
    };
});
