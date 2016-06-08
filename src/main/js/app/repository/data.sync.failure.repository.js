define([], function () {
    var DATA_SYNC_FAILURE_STORE = "dataSyncFailure";
    return function (db) {
        this.add = function (moduleId, period) {
            var dataSyncFailureStore = db.objectStore(DATA_SYNC_FAILURE_STORE);
            var payload = {
                moduleId: moduleId,
                period: period
            };
            dataSyncFailureStore.upsert(payload);
        };

        this.delete = function (moduleId, period) {
            var dataSyncFailureStore = db.objectStore(DATA_SYNC_FAILURE_STORE);
            dataSyncFailureStore.delete([moduleId, period]);
        };

        this.getAll = function () {
            var dataSyncFailureStore = db.objectStore(DATA_SYNC_FAILURE_STORE);
            return dataSyncFailureStore.getAll();
        };

    };
});