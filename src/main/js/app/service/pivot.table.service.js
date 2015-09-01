define(["dhisUrl", "lodash", "moment"], function(dhisUrl, _, moment) {
    return function($http) {
        this.getAllPivotTables = function() {
            var url = dhisUrl.pivotTables + ".json";
            var config = {
                params: {
                    "fields": ":all",
                    "filter": "name:like:Field App",
                    "paging": false,
                }
            };
            var transform = function(response) {
                return response.data.reportTables;
            };
            return $http.get(url, config).then(transform);
        };

        this.getPivotTableDataForOrgUnit = function(table, orgUnit) {
            var indicatorIds = _.pluck(table.indicators, "id");
            var dataElementIds = _.pluck(table.dataElements, "id");

            var periods = [];
            _.forIn(table.relativePeriods, function(value, key) {
                if (value === true) {
                    periods.push((_.snakeCase(key)).toUpperCase());
                }
            });

            var buildDimension = function() {
                var dimensionData = [];
                _.forEach(table.rowDimensions, function(dimension) {
                    if (dimension === 'dx') {
                        dimensionData.push(dimension + ":" + indicatorIds.concat(dataElementIds).join(";"));
                    } else {
                        var categoryDimensionIds = table.categoryDimensions.length > 0 ? _.pluck(table.categoryDimensions[0].categoryOptions, "id") : [];
                        if (categoryDimensionIds.length > 0) {
                            dimensionData.push(dimension + ":" + categoryDimensionIds.join(";"));
                        }
                    }
                });
                dimensionData.push("pe:" + periods.join(";"));
                return dimensionData;
            };
            var buildFilters = function() {
                return _.map(table.filterDimensions, function(dimension) {
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
                    "lastUpdatedAt": moment().toISOString()
                }
            }).then(function(response) {
                return response.data;
            });

        };
    };
});