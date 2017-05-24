define(['lodash', 'eventReport'], function (_, EventReport) {
    return function ($q, db) {
        var EVENT_REPORTS_STORE_NAME = 'eventReportDefinitions';

        this.getAll = function () {
            var store = db.objectStore(EVENT_REPORTS_STORE_NAME);
            return store.getAll().then(_.partial(_.map, _, EventReport.create));
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
