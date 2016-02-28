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

        this.getUpdatedCharts = function(lastUpdatedTime) {
            var getIdsOfUpdatedCharts = function() {
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

                return $http.get(dhisUrl.charts + '.json', config).then(function(response) {
                    return _.pluck(response.data.charts, 'id');
                });
            };

            var getChartDetails = function(chartId) {
                var config = {
                    params: {
                        'fields': 'id,name,title,type,sortOrder,columns[dimension,filter,items[id,name]],rows[dimension,filter,items[id,name]],filters[dimension,filter,items[id,name]]'
                    }
                };

                return $http.get(dhisUrl.charts + '/' + chartId +'.json', config).then(function(response) {
                    var chartDetails = response.data;

                    // TODO: Remove following three mappings after switching to DHIS 2.20 or greater
                    chartDetails.rows = _.map(chartDetails.rows || [], function(row) {
                        if (row.dimension === "in" || row.dimension === "de")
                            row.dimension = "dx";
                        return row;
                    });
                    chartDetails.columns = _.map(chartDetails.columns || [], function(column) {
                        if (column.dimension === "in" || column.dimension === "de")
                            column.dimension = "dx";
                        return column;
                    });
                    chartDetails.filters = _.map(chartDetails.filters || [], function(filter) {
                        if (filter.dimension === "in" || filter.dimension === "de")
                            filter.dimension = "dx";
                        return filter;
                    });

                    return chartDetails;
                });
            };

            var getIndividualChartDetails = function(chartIds) {
                var getChartDetailPromises = _.map(chartIds, getChartDetails);
                return $q.all(getChartDetailPromises);
            };

            return getIdsOfUpdatedCharts().then(getIndividualChartDetails);
        };

        this.getAllChartIds = function() {
            var config = {
                params: {
                    'filter': ['name:like:[FieldApp - '],
                    'paging': false,
                    'fields': 'id'
                }
            };

            return $http.get(dhisUrl.charts + '.json', config).then(function(response) {
                return _.pluck(response.data.charts, 'id');
            });
        };

        this.getUpdatedPivotTables = function(lastUpdatedTime) {
            var getIdsOfUpdatedPivotTables = function() {
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

                return $http.get(dhisUrl.pivotTables + '.json', config).then(function(response) {
                    return _.pluck(response.data.reportTables, 'id');
                });
            };

            var getPivotTableDetails = function(pivotTableId) {
                var config = {
                    params: {
                        'fields': 'id,name,title,type,sortOrder,columns[dimension,filter,items[id,name]],rows[dimension,filter,items[id,name]],filters[dimension,filter,items[id,name]]'
                    }
                };

                return $http.get(dhisUrl.pivotTables + '/' + pivotTableId +'.json', config).then(function(response) {
                    var pivotTableDetails = response.data;

                    // TODO: Remove following three mappings after switching to DHIS 2.20 or greater
                    pivotTableDetails.rows = _.map(pivotTableDetails.rows || [], function(row) {
                        if (row.dimension === "in" || row.dimension === "de")
                            row.dimension = "dx";
                        return row;
                    });
                    pivotTableDetails.columns = _.map(pivotTableDetails.columns || [], function(column) {
                        if (column.dimension === "in" || column.dimension === "de")
                            column.dimension = "dx";
                        return column;
                    });
                    pivotTableDetails.filters = _.map(pivotTableDetails.filters || [], function(filter) {
                        if (filter.dimension === "in" || filter.dimension === "de")
                            filter.dimension = "dx";
                        return filter;
                    });

                    return pivotTableDetails;
                });
            };

            var getIndividualPivotTableDetails = function(pivotTableIds) {
                var getPivotTableDetailPromises = _.map(pivotTableIds, getPivotTableDetails);
                return $q.all(getPivotTableDetailPromises);
            };

            return getIdsOfUpdatedPivotTables().then(getIndividualPivotTableDetails);
        };

        this.getAllPivotTableIds = function() {
            var config = {
                params: {
                    'filter': ['name:like:[FieldApp - '],
                    'paging': false,
                    'fields': 'id'
                }
            };

            return $http.get(dhisUrl.pivotTables + '.json', config).then(function(response) {
                return _.pluck(response.data.reportTables, 'id');
            });
        };
    };
});
