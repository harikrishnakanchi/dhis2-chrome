define(["dhisUrl", "lodash", "moment"], function(dhisUrl, _, moment) {
    return function($http, $q) {
        var self = this;
        this.getAllPivotTables = function() {
            var url = dhisUrl.pivotTables + ".json";
            var config = {
                params: {
                    "fields": "id",
                    "filter": "name:like:[FieldApp",
                    "paging": false,
                }
            };
            var getTableDetail = function(table) {
                var tableUrl = dhisUrl.pivotTables + "/" + table.id + ".json";
                var detail = {
                    params: {
                        "fields": "columns[dimension,filter,items[id,name]],rows[dimension,filter,items[id,name]],filters[dimension,filter,items[id,name]],!lastUpdated,!href,!created,!publicAccess,!rewindRelativePeriods,!userOrganisationUnit,!userOrganisationUnitChildren,!userOrganisationUnitGrandChildren,!externalAccess,!access,!relativePeriods,!columnDimensions,!rowDimensions,!filterDimensions,!user,!organisationUnitGroups,!itemOrganisationUnitGroups,!userGroupAccesses,!indicators,!dataElements,!dataElementOperands,!dataElementGroups,!dataSets,!periods,!organisationUnitLevels,!organisationUnits,!reportParams"
                    }
                };
                return $http.get(tableUrl, detail).then(function(response) {
                    return response.data;
                });
            };
            var transform = function(response) {
                return $q.all(_.map(response.data.reportTables, getTableDetail));
            };
            return $http.get(url, config).then(transform);
        };

        this.getAllTablesForDataset = function(datasets) {
            var re = /\[FieldApp\s*- (.*)\]/;

            var getDatasetCode = function(pivotTableName) {
                var matches = re.exec(pivotTableName);
                if (matches && matches.length > 1)
                    return matches[1];
                return undefined;
            };

            var transform = function(tables) {
                return _.transform(tables, function(result, pivotTable) {

                    var code = getDatasetCode(pivotTable.name);
                    var dataSetForTable = _.find(datasets, {
                        'code': code
                    });

                    if (dataSetForTable !== undefined)
                        result.push(_.merge(pivotTable, {
                            'dataset': dataSetForTable.id
                        }));

                }, []);
            };

            return self.getAllPivotTables().then(transform);
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
