define(["lodash"], function(_) {
    return function(db, $q) {
        var CHART_STORE_NAME = 'charts';
        var CHART_DATA_STORE_NAME = 'chartData';
        var FIELD_APP_DATASET_CODE_REGEX = /\[FieldApp - (.*)]/;

        this.upsert = function(charts) {
            var store = db.objectStore(CHART_STORE_NAME);
            return store.upsert(charts);
        };

        this.upsertChartData = function(chartName, moduleId, data) {
            var store = db.objectStore(CHART_DATA_STORE_NAME);
            var chartDataItem = {
                chart: chartName,
                orgUnit: moduleId,
                data: data
            };
            return store.upsert(chartDataItem);
        };

        this.getAllChartsForNotifications = function() {
            var store = db.objectStore(CHART_STORE_NAME);
            return store.getAll().then(function(charts) {
                return _.filter(charts, function(chart) {
                    return _.endsWith(chart.name, "Notifications");
                });
            });
        };

        this.deleteMultipleChartsById = function(idsToDelete, charts) {
            var store = db.objectStore(CHART_STORE_NAME);
            return $q.all(_.map(idsToDelete, function(id) {
                chartToDelete = _.find(charts, {
                    "id": id
                });
                return store.delete(chartToDelete.name);
            }));
        };

        this.getAll = function() {
            var parseDataSetCodes = function(allCharts) {
                return _.map(allCharts, function(chart) {
                    var matches = FIELD_APP_DATASET_CODE_REGEX.exec(chart.name);
                    chart.dataSetCode = matches && matches[1];
                    return chart;
                });
            };

            var store = db.objectStore(CHART_STORE_NAME);
            return store.getAll().then(parseDataSetCodes);
        };

        this.getDataForChart = function(chartName, orgUnitId) {
            var query = db.queryBuilder().$eq(chartName).$index("by_chart").compile();
            var store = db.objectStore(CHART_DATA_STORE_NAME);

            return store.each(query).then(function(data) {
                var output = _(data).filter({
                    orgUnit: orgUnitId
                }).map('data').first();
                return output;
            });
        };
    };
});
