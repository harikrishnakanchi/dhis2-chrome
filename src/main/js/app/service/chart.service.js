define(["dhisUrl", "lodash"], function(dhisUrl, _) {
    return function($http, chartRepository) {
        var self = this;
        this.getChartDataForOrgUnit = function(chart, orgUnit) {
            var indicatorIds = _.pluck(chart.indicators, "id");
            var dataElementIds = _.pluck(chart.dataElements, "id");

            var periods = [];
            _.forIn(chart.relativePeriods, function(value, key) {
                if (value === true) {
                    periods.push((_.snakeCase(key)).toUpperCase());
                }
            });

            return $http.get(dhisUrl.analytics, {
                params: {
                    "dimension": ["dx:" + indicatorIds.concat(dataElementIds).join(";"), "pe:" + periods.join(";")],
                    "filter": "ou:" + orgUnit,
                    "displayProperty": "NAME"
                }
            }).then(function(response) {
                return response.data;
            });

        };

        this.getAllFieldAppCharts = function() {
            var url = dhisUrl.charts + ".json";
            var config = {
                params: {
                    "fields": "name,id,type,organisationUnits,relativePeriods,dataElements,indicators,title",
                    "filter": "name:like:[FieldApp - ",
                    "paging": false,
                }
            };

            return $http.get(url, config);
        };

        this.getAllFieldAppChartsForDataset = function(datasets) {
            var re = /\[FieldApp - (.*)\]/;

            var getDatasetCode = function(chartName) {
                var matches = re.exec(chartName);
                if (matches && matches.length > 1)
                    return matches[1];
                return undefined;
            };

            var transform = function(charts) {
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

            return chartRepository.getAll().then(transform);
        };

    };
});
