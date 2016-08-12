define(['dateUtils', 'lodash'], function (dateUtils, _) {
    return function ($rootScope) {

        var DELIMITER = ',',
            NEW_LINE = '\n';

        var escapeString = function (string) {
            return '"' + string + '"';
        };

        var getNumberOfWeeksLabel = function (month) {
            return '[' + dateUtils.getNumberOfISOWeeksInMonth(month) + ' ' + $rootScope.resourceBundle.weeksLabel + ']';
        };

        var getColumnHeader = function (items) {
            var firstItem = _.first(items);

            return (firstItem.categoryDimension && $rootScope.resourceBundle.label.category) ||
                   (firstItem.dataDimension && $rootScope.resourceBundle.label.dataDimension) ||
                   (firstItem.orgUnitDimension && $rootScope.resourceBundle.label.organisationUnit) ||
                   (firstItem.periodDimension && $rootScope.resourceBundle.label.period);
        };

        this.build = function (pivotTableData) {
            var mainColumns = _.first(pivotTableData.columns),
                subColumns = _.slice(pivotTableData.columns, 1);


            var buildHeaders = function() {
                var cells = _.map([pivotTableData.rows].concat(subColumns), function(items) {
                    return escapeString(getColumnHeader(items));
                });

                _.each(mainColumns, function (column) {
                    if(pivotTableData.monthlyReport && column.periodDimension) {
                        cells.push(escapeString(pivotTableData.getDisplayName(column) + ' ' + getNumberOfWeeksLabel(column.id)));
                    } else {
                        cells.push(escapeString(pivotTableData.getDisplayName(column)));
                    }
                });
                return cells.join(DELIMITER);
            };

            var buildRows = function () {
                var buildRowsForSubColumns = function (subColumns, rowSpecifiers) {
                    if(_.isEmpty(subColumns)) {
                        var cells = _.map(rowSpecifiers, function (rowSpecifier) {
                            return escapeString(pivotTableData.getDisplayName(rowSpecifier));
                        });

                        _.each(mainColumns, function (column) {
                            var combinedRow = _.reduce(rowSpecifiers, _.merge, {});
                            var value = pivotTableData.getDataValue(combinedRow, column);
                            cells.push(value);
                        });
                        return cells.join(DELIMITER);
                    } else {
                        var thisSubColumn = _.first(subColumns),
                            remainingSubColumns = _.slice(subColumns, 1);

                        return _.map(thisSubColumn, function(columnItem) {
                            return buildRowsForSubColumns(remainingSubColumns, rowSpecifiers.concat(columnItem));
                        });
                    }
                };

                return _.map(pivotTableData.rows, function (row) {
                    return buildRowsForSubColumns(subColumns, [row]);
                });
            };

            return _.flattenDeep([
                buildHeaders(),
                buildRows()
            ]).join(NEW_LINE);
        };
    };
});