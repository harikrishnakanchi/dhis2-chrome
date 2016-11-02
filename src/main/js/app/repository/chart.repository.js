define(['chart', 'chartData', 'lodash'], function(Chart, ChartData, _) {
    return function(db, $q, categoryRepository) {
        var CHART_STORE_NAME = 'chartDefinitions';
        var CHART_DATA_STORE_NAME = 'chartData';

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

        this.deleteMultipleChartsById = function(idsToDelete) {
            var store = db.objectStore(CHART_STORE_NAME);
            return $q.all(_.map(idsToDelete, function(chartId) {
                return store.delete(chartId);
            }));
        };

        this.getAll = function() {
            var store = db.objectStore(CHART_STORE_NAME);

            return store.getAll().then(function (charts) {
                var categoryDimensions = _.flatten(_.map(charts, 'categoryDimensions'));

                return categoryRepository.enrichWithCategoryOptions(categoryDimensions)
                    .then(_.partial(_.map, charts, Chart.create));
            });
        };

        this.getDataForChart = function(chartName, orgUnitId) {
            var store = db.objectStore(CHART_DATA_STORE_NAME);
            return store.find([chartName, orgUnitId]).then(function (chartData) {
                return !!chartData && chartData.data;
            });
        };

        this.getChartData = function (chartDefinition, orgUnitId) {
            var store = db.objectStore(CHART_DATA_STORE_NAME);
            return store.find([chartDefinition.name, orgUnitId]).then(function (chartData) {
                return chartData && ChartData.create(chartDefinition, chartData.data);
            });
        };
    };
});
