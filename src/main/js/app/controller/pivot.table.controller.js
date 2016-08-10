define(["lodash", "dateUtils", "moment"], function(_, dateUtils, moment) {
    return function($scope, $rootScope, translationsService, filesystemService) {
        $scope.resourceBundle = $rootScope.resourceBundle;
        var DEFAULT_SORT_KEY = 'dataElementIndex';

        $scope.showDownloadButton = $scope.disableDownload != 'true';

        var getCSVContents = function() {
            var DELIMITER = ',',
                NEW_LINE = '\n',
                EMPTY_CELL = '';

            var escapeString = function (string) {
                return '"' + string + '"';
            };

            var buildHeaders = function() {
                return _.map($scope.table.columns, function (columnConfiguration) {
                    var columnWidth = $scope.baseColumnConfiguration.length / columnConfiguration.length,
                        cells = [EMPTY_CELL];

                    _.each(columnConfiguration, function (column) {
                        _.times(columnWidth, function () {
                            if($scope.table.monthlyReport && column.periodDimension) {
                                cells.push(escapeString(column.name + ' ' + $scope.getNumberOfWeeksLabel(column.id)));
                            } else {
                                cells.push(escapeString(column.name));
                            }
                        });
                    });
                    return cells.join(DELIMITER);
                });
            };

            var buildRows = function () {
                return _.map($scope.table.rows, function (row) {
                    var cells = [escapeString($scope.getDataDimensionName(row.name))];

                    _.each($scope.baseColumnConfiguration, function (column) {
                        var value = $scope.getDataValue(row.dataValuesFilter, column.dataValuesFilter);
                        cells.push(value);
                    });
                    return cells.join(DELIMITER);
                });
            };

            return _.flatten([
                buildHeaders(),
                buildRows()
            ]).join(NEW_LINE);
        };

        $scope.exportToCSV = function () {
            var fileName = [$scope.table.dataSetCode, $scope.table.title, moment().format("DD-MMM-YYYY"), 'csv'].join('.');
            filesystemService.promptAndWriteFile(fileName, new Blob([getCSVContents()], {type: 'text/csv'}), filesystemService.FILE_TYPE_OPTIONS.CSV);
        };

        $scope.getDataDimensionName = function(name) {
            //TODO: Remove this formatting of names after we start using dataElement and indicators formName
            var HYPHEN_SEPARATOR = ' - ';
            return _.first(name.split(HYPHEN_SEPARATOR));
        };

        $scope.getDataValue = function (rowDataValuesFilter, columnDataValuesFilter) {
            var dataValue = _.find($scope.table.dataValues, _.merge({}, rowDataValuesFilter, columnDataValuesFilter));
            return dataValue && dataValue.value;
        };

        $scope.sortByColumn = function (column) {
            var sumOfDataValues = function (row) {
                var matchingDataValues = _.filter($scope.table.dataValues, _.merge({}, row.dataValuesFilter, column.dataValuesFilter));
                return _.sum(_.reject(matchingDataValues, { excludedFromTotals: true }), 'value');
            };

            var updateSortedFlags = function (sortedColumn) {
                var allColumns = _.flatten($scope.table.columns);
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
            $scope.baseColumnConfiguration = _.last($scope.table.columns);

            var sortableColumns = _.first($scope.table.columns);
            _.each(sortableColumns, function (column) {
                column.sortable = true;
            });
        }
    };
});