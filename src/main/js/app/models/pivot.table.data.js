define(['analyticsData', 'lodash'], function(AnalyticsData, _) {

    var PivotTableData = function(definition, data, shouldNotExcludeEmptyDataValues) {
        this.title = definition.title;
        this.serviceCode = definition.serviceCode;
        this.referralLocationReport = definition.referralLocationReport;
        this.displayPosition = definition.displayPosition;
        this.weeklyReport = definition.weeklyReport;
        this.monthlyReport = definition.monthlyReport;
        this.sortAscending = definition.sortAscending;
        this.sortDescending = definition.sortDescending;
        this.sortable = definition.sortable;
        this.hideWeeks = definition.hideWeeks;

        var analyticsData = AnalyticsData.create(definition, data);

        this.rows = mapRows(analyticsData, shouldNotExcludeEmptyDataValues);
        this.columns = mapColumns(analyticsData, definition, shouldNotExcludeEmptyDataValues);
        this.columnConfigurations = getCartesianProductOfColumns(this.columns);
        this.isDataAvailable = analyticsData.isDataAvailable;
        this.getDataValue = analyticsData.getDataValue;
        this.getTotalOfDataValues = analyticsData.getTotalOfDataValues;
        this.getDisplayName = analyticsData.getDisplayName;
    };

    var filterItemsWithDataValues = function (items, analyticsData) {
        return _.filter(items, function (item) {
            return item.categoryDimension ? true : analyticsData.dataValuesExist(item);
        });
    };

    var mapRows = function (analyticsData, shouldNotExcludeEmptyDataValues) {
        var firstRow = _.first(analyticsData.rows);
        var data = firstRow;
        if (!shouldNotExcludeEmptyDataValues) {
            data = filterItemsWithDataValues(firstRow, analyticsData);
        }
        return _.map(data, function (row, index) {
            return _.set(row, 'rowNumber', index + 1);
        });
    };

    var mapColumns = function (analyticsData, definition, shouldNotExcludeEmptyDataValues) {
        var mappedColumns = analyticsData.columns;
        if (!shouldNotExcludeEmptyDataValues)
            mappedColumns = _.map(mappedColumns, function (column) {
            return filterItemsWithDataValues(column, analyticsData);
        });
        return _.reject(mappedColumns, function (column) {
            return definition.geographicOriginReport && column.length == 1 && _.first(column).dataDimension;
        });
    };

    var getCartesianProductOfColumns = function (columns) {
        return _.transform(columns, function (cartesianProduct, thisColumn) {
            var previousColumn = _.last(cartesianProduct);
            if(previousColumn) {
                var cartesianProductOfColumns = _.flatten(_.map(previousColumn, function (parentColumnItem) {
                    return _.map(thisColumn, function (columnItem) {
                        return _.merge({}, { dataValuesFilter: parentColumnItem.dataValuesFilter }, columnItem);
                    });
                }));
                cartesianProduct.push(cartesianProductOfColumns);
            } else {
                cartesianProduct.push(_.cloneDeep(thisColumn));
            }
        }, []);
    };

    PivotTableData.create = function () {
        var pivotTableData = Object.create(PivotTableData.prototype);
        PivotTableData.apply(pivotTableData, arguments);
        return pivotTableData;
    };

    return PivotTableData;
});