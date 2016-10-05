define(["lodash", "dateUtils", "moment"], function(_, dateUtils, moment) {
    return function($scope, $rootScope, translationsService, filesystemService, pivotTableExportBuilder) {
        var REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY hh[.]mm A";
        var REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA = "D MMMM YYYY hh[.]mm A";

        $scope.resourceBundle = $rootScope.resourceBundle;
        $scope.showDownloadButton = $scope.disableDownload != 'true';

        var DELIMITER = ',',
            NEW_LINE = '\n',
            EMPTY_CELL = '';

        var escapeString = function (string) {
            return '"' + string + '"';
        };

        var getLastUpdatedTimeContent = function () {
            var formattedTime = moment($scope.updatedTime, REPORTS_LAST_UPDATED_TIME_FORMAT).format(REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA);
            return [escapeString('Updated'), escapeString(formattedTime)].join(DELIMITER);
        };

        $scope.exportToCSV = function () {
            var formattedDate = moment($scope.updatedTime, REPORTS_LAST_UPDATED_TIME_FORMAT).format(REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA),
                updatedTimeDetails = $scope.updatedTime ? '[updated ' + formattedDate + ']' : moment().format("DD-MMM-YYYY"),
                fileName = [$scope.table.dataSetCode, $scope.table.title, updatedTimeDetails, 'csv'].join('.'),
                csvContent = [getLastUpdatedTimeContent(), EMPTY_CELL, pivotTableExportBuilder.build($scope.table)].join(NEW_LINE);

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