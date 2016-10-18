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

        var enrichChartDefinitionWithCategoryOptions = function (chartDefinition, categoryOptions) {
            chartDefinition.categoryDimensions = _.map(chartDefinition.categoryDimensions, function (categoryDimension) {
                categoryDimension.categoryOptions = _.map(categoryDimension.categoryOptions, function (categoryOption) {
                    return categoryOptions[categoryOption.id] || categoryOption;
                });
                return categoryDimension;
            });
            return chartDefinition;
        };

        this.getAll = function() {
            var store = db.objectStore(CHART_STORE_NAME);
            return $q.all([store.getAll(), categoryRepository.getAllCategoryOptions()]).then(function (data) {
                var chartDefinitions = _.first(data);
                var allCategoryOptions = _.indexBy(_.last(data), 'id');
                var enrichChartDefinitions = _.flowRight(Chart.create, _.partial(enrichChartDefinitionWithCategoryOptions, _, allCategoryOptions));
                return _.map(chartDefinitions, enrichChartDefinitions);
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
