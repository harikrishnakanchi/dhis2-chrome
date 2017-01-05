define(["lodash", "dateUtils", "moment", "excelBuilder"], function(_, dateUtils, moment, excelBuilder) {
    return function($scope, $rootScope, translationsService, filesystemService, pivotTableExportBuilder) {
        var REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY hh[.]mm A";
        var REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA = "D MMMM YYYY hh[.]mm A";

        $scope.resourceBundle = $rootScope.resourceBundle;
        $scope.showDownloadButton = $scope.disableDownload != 'true';

        var EMPTY_ROW = [];

        var getLastUpdatedTimeContent = function () {
            var formattedTime = moment($scope.updatedTime, REPORTS_LAST_UPDATED_TIME_FORMAT).format(REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA);
            return ['Updated', formattedTime];
        };

        $scope.exportToExcel = function () {
            var formattedDate = moment($scope.updatedTime, REPORTS_LAST_UPDATED_TIME_FORMAT).format(REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA),
                updatedTimeDetails = $scope.updatedTime ? '[updated ' + formattedDate + ']' : moment().format("DD-MMM-YYYY"),
                fileName = [$scope.table.serviceCode, $scope.table.title, updatedTimeDetails].join('.');

            var spreadSheetContent = [{
                name: $scope.table.title,
                data: [
                    getLastUpdatedTimeContent(),
                    EMPTY_ROW
                ].concat(pivotTableExportBuilder.build($scope.table, $scope.referralLocations))
            }];

            filesystemService.promptAndWriteFile(fileName, excelBuilder.createWorkBook(spreadSheetContent), filesystemService.FILE_TYPE_OPTIONS.XLSX);
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