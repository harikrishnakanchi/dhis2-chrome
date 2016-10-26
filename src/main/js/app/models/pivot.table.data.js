define(['analyticsData', 'lodash'], function(AnalyticsData, _) {

    var PivotTableData = function(definition, data) {
        this.title = definition.title;
        this.serviceCode = definition.serviceCode;
        this.displayPosition = definition.displayPosition;
        this.weeklyReport = definition.weeklyReport;
        this.monthlyReport = definition.monthlyReport;
        this.sortAscending = definition.sortAscending;
        this.sortDescending = definition.sortDescending;
        this.sortable = definition.sortable;

        var analyticsData = AnalyticsData.create(definition, data);

        this.rows = mapRows(analyticsData);
        this.columns = mapColumns(analyticsData, definition);
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

    var mapRows = function (analyticsData) {
        var firstRow = _.first(analyticsData.rows);
        return _.map(filterItemsWithDataValues(firstRow, analyticsData), function (row, index) {
            return _.set(row, 'rowNumber', index + 1);
        });
    };

    var mapColumns = function (analyticsData, definition) {
        var mappedColumns = _.map(analyticsData.columns, function (column) {
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