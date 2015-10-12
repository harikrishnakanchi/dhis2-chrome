define(["dhisUrl", "lodash", "moment"], function(dhisUrl, _, moment) {
    return function($http, $q) {
        var fieldAppReportRegex = /\[FieldApp - (.*)\]/;

        this.getReportDataForOrgUnit = function(report, orgUnit) {

            var buildDimension = function() {
                var columnDimensions = _.map(report.columns, function(col) {
                    return col.dimension + ":" + _.pluck(col.items, "id").join(";");
                });

                var rowDimensions = _.map(report.rows, function(row) {
                    return row.dimension + ":" + _.pluck(row.items, "id").join(";");
                });

                return _.flatten([columnDimensions, rowDimensions]);
            };

            var buildFilters = function() {
                return _.map(report.filters, function(filter) {
                    if (filter.dimension === "ou")
                        return "ou:" + orgUnit;
                    return filter.dimension + ":" + _.pluck(filter.items, "id").join(";");
                });
            };

            return $http.get(dhisUrl.analytics, {
                params: {
                    "dimension": buildDimension(),
                    "filter": buildFilters(),
                    "lastUpdatedAt": moment().toISOString() //required for cache-busting purposes
                }
            }).then(function(response) {
                return response.data;
            });
        };

        var filterAndMergeDatasetInfo = function(reports, datasets) {
            var getDataset = function(report) {
                var matches = fieldAppReportRegex.exec(report.name);
                if (!matches || matches.length <= 1)
                    return undefined;
                var datasetCodeInReportName = matches[1];

                return _.find(datasets, {
                    'code': datasetCodeInReportName
                });
            };

            return _.transform(reports, function(result, report) {

                var dataset = getDataset(report);

                if (dataset !== undefined) {
                    result.push(_.merge(report, {
                        'dataset': dataset.id
                    }));
                }

            }, []);
        };

        var enrich = function(reports) {
            var enrichReportPromises = _.map(reports, function(report) {
                var url = report.href + "?fields=*,program[id,name],programStage[id,name],columns[dimension,filter,items[id,name]],rows[dimension,filter,items[id,name]],filters[dimension,filter,items[id,name]]";
                return $http.get(url).then(function(response) {
                    reportDetails = response.data;
                    reportDetails.dataset = report.dataset;

                    // TODO: Remove following three mappings after switching to DHIS 2.20 or greater
                    reportDetails.rows = _.map(reportDetails.rows || [], function(row) {
                        if (row.dimension === "in")
                            row.dimension = "dx";
                        return row;
                    });
                    reportDetails.columns = _.map(reportDetails.columns || [], function(column) {
                        if (column.dimension === "in")
                            column.dimension = "dx";
                        return column;
                    });
                    reportDetails.filters = _.map(reportDetails.filters || [], function(filter) {
                        if (filter.dimension === "in")
                            filter.dimension = "dx";
                        return filter;
                    });

                    return reportDetails;
                });
            });
            return $q.all(enrichReportPromises);
        };

        this.getCharts = function(datasets) {

            var getFieldAppCharts = function() {
                var config = {
                    params: {
                        "filter": "name:like:[FieldApp - ",
                        "paging": false,
                    }
                };

                return $http.get(dhisUrl.charts, config).then(function(response) {
                    return response.data ? filterAndMergeDatasetInfo(response.data.charts, datasets) : [];
                });
            };

            return getFieldAppCharts().then(enrich);
        };

        this.getPivotTables = function(datasets) {

            var getFieldAppPivotTables = function() {
                var config = {
                    params: {
                        "filter": "name:like:[FieldApp - ",
                        "paging": false,
                    }
                };

                return $http.get(dhisUrl.pivotTables, config).then(function(response) {
                    return response.data ? filterAndMergeDatasetInfo(response.data.reportTables, datasets) : [];
                });
            };

            return getFieldAppPivotTables().then(enrich);
        };

    };
});
