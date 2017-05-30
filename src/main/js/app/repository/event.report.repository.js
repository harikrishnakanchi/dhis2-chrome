define(['lodash', 'eventReport'], function (_, EventReport) {
    return function ($q, db) {
        var EVENT_REPORTS_STORE_NAME = 'eventReportDefinitions';
        var EVENT_REPORT_DATA_STORE_NAME = 'eventReportData';

        this.getAll = function () {
            var store = db.objectStore(EVENT_REPORTS_STORE_NAME);
            return store.getAll().then(_.partial(_.map, _, EventReport.create));
        };

        this.upsert = function (eventReports) {
            var store = db.objectStore(EVENT_REPORTS_STORE_NAME);
            return store.upsert(eventReports);
        };

        this.upsertEventReportData = function (eventReportId, orgUnitId, eventReportData) {
            var store = db.objectStore(EVENT_REPORT_DATA_STORE_NAME);
            var eventReportDataItem = {
                data: eventReportData,
                eventReport: eventReportId,
                orgUnit: orgUnitId
            };
            return store.upsert(eventReportDataItem);
        };

        this.deleteEventReportsById = function (eventReportIds) {
            var store = db.objectStore(EVENT_REPORTS_STORE_NAME);
            return $q.all(_.map(eventReportIds, function (eventReportId) {
                 return store.delete(eventReportId);
            }));
        };
    };
});
