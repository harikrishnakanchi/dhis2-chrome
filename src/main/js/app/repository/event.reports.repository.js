define([], function () {
    return function ($q, db) {
        var EVENT_REPORTS_STORE_NAME = 'eventReports';
        this.getAll = function () {
            var store = db.objectStore(EVENT_REPORTS_STORE_NAME);
            return store.getAll();
        };

        this.upsert = function (eventReports) {
            var store = db.objectStore(EVENT_REPORTS_STORE_NAME);
            return store.upsert(eventReports);
        };

        this.deleteEventReportsById = function (eventReportIds) {
            var store = db.objectStore(EVENT_REPORTS_STORE_NAME);
            return $q.all(_.map(eventReportIds, function (eventReportId) {
                 return store.delete(eventReportId);
            }));
        };
    };
});
