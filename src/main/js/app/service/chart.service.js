define(["dhisUrl", "lodash"], function(dhisUrl, _) {
    return function($http) {

        this.getChartDataForOrgUnit = function(chart, orgUnit) {
            var indicatorIds = _.pluck(chart.indicators, "id");
            var dataElementIds = _.pluck(chart.dataElements, "id");

            var periods = [];
            _.forIn(chart.relativePeriods, function(value, key) {
                if (value === true) {
                    periods.push((_.snakeCase(key)).toUpperCase());
                }
            });

            var buildDimension = function() {
                var categoryDimensionIds = chart.categoryDimensions.length > 0 ? _.pluck(chart.categoryDimensions[0].categoryOptions, "id") : [];
                var dimensionIds = categoryDimensionIds.length > 0 ? categoryDimensionIds.join(";") : indicatorIds.concat(dataElementIds).join(";");
                return [chart.series + ":" + dimensionIds, "pe:" + periods.join(";")];
            };
            var buildFilters = function() {
                return _.map(chart.filterDimensions, function(dimension) {
                    switch (dimension) {
                        case "ou":
                            return dimension + ":" + orgUnit;
                        case "dx":
                            return dimension + ":" + dataElementIds.join(";");
                    }
                });
            };
            return $http.get(dhisUrl.analytics, {
                params: {
                    "dimension": buildDimension(),
                    "filter": buildFilters(),
                    "displayProperty": "NAME",
                    "chartTitle": chart.title,
                    "lastUpdatedAt": moment().toISOString() //required for cache-busting purposes
                }
            }).then(function(response) {
                return response.data;
            });

        };

        this.getAllFieldAppCharts = function(datasets) {
            var re = /\[FieldApp - (.*)\]/;

            var getDatasetCode = function(chartName) {
                var matches = re.exec(chartName);
                if (matches && matches.length > 1)
                    return matches[1];
                return undefined;
            };

            var transform = function(response) {
                var charts = response.data.charts;
                return _.transform(charts, function(result, chart) {

                    var datasetForChart = _.find(datasets, {
                        'code': getDatasetCode(chart.name)
                    });

                    if (datasetForChart !== undefined)
                        result.push(_.merge(chart, {
                            'dataset': datasetForChart.id
                        }));

                }, []);
            };

            var url = dhisUrl.charts + ".json";
            var config = {
                params: {
                    "fields": ":all",
                    "filter": "name:like:[FieldApp - ",
                    "paging": false,
                }
            };

            return $http.get(url, config).then(transform);
        };

    };
});
