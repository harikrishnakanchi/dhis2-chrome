define(['chart', 'chartData', 'lodash'], function(Chart, ChartData, _) {
    return function(db, $q, categoryRepository, dataElementRepository, indicatorRepository, programIndicatorRepository) {
        var CHART_STORE_NAME = 'chartDefinitions';
        var CHART_DATA_STORE_NAME = 'chartData';

        this.upsert = function(charts) {
            var store = db.objectStore(CHART_STORE_NAME);
            return store.upsert(charts);
        };

        this.upsertChartData = function(chartId, moduleId, data) {
            var store = db.objectStore(CHART_DATA_STORE_NAME);
            var chartDataItem = {
                chart: chartId,
                orgUnit: moduleId,
                data: data
            };
            return store.upsert(chartDataItem);
        };

        this.getAllChartsForNotifications = function() {
            return this.getAll().then(function(charts) {
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
                var categoryDimensions = _.flatten(_.map(charts, 'categoryDimensions')),
                    dataElements = _.compact(_.map(_.flatten(_.map(charts, 'dataDimensionItems')), 'dataElement')),
                    indicators = _.compact(_.map(_.flatten(_.map(charts, 'dataDimensionItems')), 'indicator')),
                    programIndicators = _.compact(_.map(_.flatten(_.map(charts, 'dataDimensionItems')), 'programIndicator'));

                return $q.all([categoryRepository.enrichWithCategoryOptions(categoryDimensions),
                        dataElementRepository.enrichWithDataElementsDetails(dataElements),
                        indicatorRepository.enrichWithIndicatorDetails(indicators),
                        programIndicatorRepository.enrichWithProgramIndicatorDetails(programIndicators)])
                    .then(_.partial(_.map, charts, Chart.create));
            });
        };

        this.getDataForChart = function(chartId, orgUnitId) {
            var store = db.objectStore(CHART_DATA_STORE_NAME);
            return store.find([chartId, orgUnitId]).then(function (chartData) {
                return !!chartData && chartData.data;
            });
        };

        this.getChartData = function (chartDefinition, orgUnitId) {
            var store = db.objectStore(CHART_DATA_STORE_NAME);
            return store.find([chartDefinition.id, orgUnitId]).then(function (chartData) {
                return chartData && ChartData.create(chartDefinition, chartData.data);
            });
        };
    };
});
