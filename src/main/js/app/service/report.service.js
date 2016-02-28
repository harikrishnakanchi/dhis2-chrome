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
                return _.transform(report.filters, function(result, filter) {
                    if (filter.dimension === "ou")
                        return;
                    result.push(filter.dimension + ":" + _.pluck(filter.items, "id").join(";"));
                }, ["ou:" + orgUnit]);
            };

            var config = {
                params: {
                    "dimension": buildDimension(),
                    "filter": buildFilters(),
                    "lastUpdatedAt": moment().toISOString() //required for cache-busting purposes
                }
            };

            return $http.get(dhisUrl.analytics, config).then(function(response) {
                var queryString = _.map(config.params, function(values, key) {
                    return _.map(_.flatten([values]), function(value) {
                        return key + '=' + value;
                    }).join("&");
                }).join("&");

                return _.merge(response.data, {
                    "url": dhisUrl.analytics + "?" + queryString
                });
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
                        if (row.dimension === "in" || row.dimension === "de")
                            row.dimension = "dx";
                        return row;
                    });
                    reportDetails.columns = _.map(reportDetails.columns || [], function(column) {
                        if (column.dimension === "in" || column.dimension === "de")
                            column.dimension = "dx";
                        return column;
                    });
                    reportDetails.filters = _.map(reportDetails.filters || [], function(filter) {
                        if (filter.dimension === "in" || filter.dimension === "de")
                            filter.dimension = "dx";
                        return filter;
                    });

                    return reportDetails;
                });
            });
            return $q.all(enrichReportPromises);
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

        var getResourceIds = function(resourceUrl, resourceCollectionName, lastUpdatedTime) {
            var config = {
                params: {
                    'filter': ['name:like:[FieldApp - '],
                    'paging': false,
                    'fields': 'id'
                }
            };

            if(lastUpdatedTime) {
                config.params.filter.push('lastUpdated:gte:' + lastUpdatedTime);
            }

            return $http.get(resourceUrl + '.json', config).then(function(response) {
                return _.pluck(response.data[resourceCollectionName], 'id');
            });
        };

        var getResourceDetails = function(resourceUrl, resourceIds) {
            var config = {
                params: {
                    'fields': 'id,name,title,type,sortOrder,columns[dimension,filter,items[id,name]],rows[dimension,filter,items[id,name]],filters[dimension,filter,items[id,name]]'
                }
            };

            var getIndividualResourceDetails = function(resourceId) {
                return $http.get(resourceUrl + '/' + resourceId + '.json', config).then(function (response) {
                    var resourceDetails = response.data;

                    // TODO: Remove following three mappings after switching to DHIS 2.20 or greater
                    resourceDetails.rows = _.map(resourceDetails.rows || [], function (row) {
                        if (row.dimension === "in" || row.dimension === "de")
                            row.dimension = "dx";
                        return row;
                    });
                    resourceDetails.columns = _.map(resourceDetails.columns || [], function (column) {
                        if (column.dimension === "in" || column.dimension === "de")
                            column.dimension = "dx";
                        return column;
                    });
                    resourceDetails.filters = _.map(resourceDetails.filters || [], function (filter) {
                        if (filter.dimension === "in" || filter.dimension === "de")
                            filter.dimension = "dx";
                        return filter;
                    });

                    return resourceDetails;
                });
            };

            var allPromises = _.map(resourceIds, getIndividualResourceDetails);
            return $q.all(allPromises);
        };

        this.getUpdatedCharts = function(lastUpdatedTime) {
            return getResourceIds(dhisUrl.charts, 'charts', lastUpdatedTime).then(_.partial(getResourceDetails, dhisUrl.charts));
        };

        this.getAllChartIds = function() {
            return getResourceIds(dhisUrl.charts, 'charts');
        };

        this.getUpdatedPivotTables = function(lastUpdatedTime) {
            return getResourceIds(dhisUrl.pivotTables, 'reportTables', lastUpdatedTime).then(_.partial(getResourceDetails, dhisUrl.pivotTables));
        };

        this.getAllPivotTableIds = function() {
            return getResourceIds(dhisUrl.pivotTables, 'reportTables');
        };
    };
});
