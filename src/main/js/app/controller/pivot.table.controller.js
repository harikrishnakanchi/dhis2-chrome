define(["lodash", "dateUtils", "moment"], function(_, dateUtils, moment) {
    return function($scope, $rootScope, translationsService, filesystemService) {
        $scope.resourceBundle = $rootScope.resourceBundle;
        $scope.showDownloadButton = $scope.disableDownload != 'true';

        var getCSVContents = function() {
            var DELIMITER = ',',
                NEW_LINE = '\n',
                mainColumns = _.first($scope.table.columns),
                subColumns = _.slice($scope.table.columns, 1);

            var escapeString = function (string) {
                return '"' + string + '"';
            };

            var getColumnHeader = function (items) {
                var firstItem = _.first(items);

                return (firstItem.categoryDimension && $scope.resourceBundle.label.category) ||
                       (firstItem.dataDimension && $scope.resourceBundle.label.dataDimension) ||
                       (firstItem.orgUnitDimension && $scope.resourceBundle.label.organisationUnit) ||
                       (firstItem.periodDimension && $scope.resourceBundle.label.period);
            };

            var buildHeaders = function() {
                var cells = _.map([$scope.table.rows].concat(subColumns), function(items) {
                    return escapeString(getColumnHeader(items));
                });

                _.each(mainColumns, function (column) {
                    if($scope.table.monthlyReport && column.periodDimension) {
                        cells.push(escapeString($scope.table.getDisplayName(column) + ' ' + $scope.getNumberOfWeeksLabel(column.id)));
                    } else {
                        cells.push(escapeString($scope.table.getDisplayName(column)));
                    }
                });
                return cells.join(DELIMITER);
            };

            var buildRows = function () {
                var buildRowsForSubColumns = function (subColumns, rowSpecifiers) {
                    if(_.isEmpty(subColumns)) {
                        var cells = _.map(rowSpecifiers, function (rowSpecifier) {
                            return escapeString($scope.table.getDisplayName(rowSpecifier));
                        });

                        _.each(mainColumns, function (column) {
                            var combinedRow = _.reduce(rowSpecifiers, _.merge, {});
                            var value = $scope.table.getDataValue(combinedRow, column);
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

                return _.map($scope.table.rows, function (row) {
                    return buildRowsForSubColumns(subColumns, [row]);
                });
            };

            return _.flattenDeep([
                buildHeaders(),
                buildRows()
            ]).join(NEW_LINE);
        };

        $scope.exportToCSV = function () {
            var fileName = [$scope.table.dataSetCode, $scope.table.title, moment().format("DD-MMM-YYYY"), 'csv'].join('.');
            filesystemService.promptAndWriteFile(fileName, new Blob([getCSVContents()], {type: 'text/csv'}), filesystemService.FILE_TYPE_OPTIONS.CSV);
        };

        $scope.sortByColumn = function (column) {
            var sumOfDataValues = function (row) {
                var sum = $scope.table.getTotalOfDataValues(row, column);
                return _.isNumber(sum) ? sum : ($scope.table.sortAscending ? Infinity : -Infinity);
            };

            var updateSortedFlags = function (sortedColumn) {
                var allColumns = _.flatten($scope.table.columnConfigurations);
                _.each(allColumns, function (column) {
                    if(sortedColumn) {
                        var sortedColumnFilterDimensions = _.keys(sortedColumn.dataValuesFilter);
                        column.sorted = _.all(sortedColumnFilterDimensions, function (dimension) {
                            return column.dataValuesFilter[dimension] == sortedColumn.dataValuesFilter[dimension];
                        });
                    } else {
                        column.sorted = false;
                    }
                });
            };

            if(column.sorted) {
                updateSortedFlags();
                $scope.table.rows = _.sortByOrder($scope.table.rows, ['rowNumber'], ['asc']);
            } else {
                updateSortedFlags(column);
                $scope.table.rows = _.sortByOrder($scope.table.rows, [sumOfDataValues, 'rowNumber'], [$scope.table.sortAscending ? 'asc' : 'desc', 'asc']);
            }
        };

        $scope.getNumberOfWeeksLabel = function (month) {
            return '[' + dateUtils.getNumberOfISOWeeksInMonth(month) + ' ' + $scope.resourceBundle.weeksLabel + ']';
        };

        if ($scope.table) {
            $scope.baseColumnConfiguration = _.last($scope.table.columnConfigurations);

            var sortableColumns = _.first($scope.table.columnConfigurations);
            _.each(sortableColumns, function (column) {
                column.sortable = true;
            });
        }
    };
});