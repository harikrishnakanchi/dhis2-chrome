define(["lodash", "dateUtils", "moment"], function(_, dateUtils, moment) {
    return function($scope, $rootScope, translationsService, filesystemService, pivotTableCsvBuilder) {
        $scope.resourceBundle = $rootScope.resourceBundle;
        $scope.showDownloadButton = $scope.disableDownload != 'true';

        $scope.exportToCSV = function () {
            var fileName = [$scope.table.dataSetCode, $scope.table.title, moment().format("DD-MMM-YYYY"), 'csv'].join('.'),
                csvContent = pivotTableCsvBuilder.build($scope.table);

            filesystemService.promptAndWriteFile(fileName, new Blob([csvContent], {type: 'text/csv'}), filesystemService.FILE_TYPE_OPTIONS.CSV);
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