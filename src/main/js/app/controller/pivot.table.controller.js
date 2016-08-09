define(["lodash", "moment"], function(_, moment) {
    return function($scope, $rootScope, translationsService, filesystemService) {
        $scope.resourceBundle = $rootScope.resourceBundle;
        var DEFAULT_SORT_KEY = 'dataElementIndex';

        $scope.showDownloadButton = $scope.disableDownload != 'true';

        var getCsvFileName = function() {
            var regex = /^\[FieldApp - ([a-zA-Z0-9()><]+)\]\s([a-zA-Z0-9\s]+)/;
            var match = regex.exec($scope.definition.name);
            if (match) {
                var serviceName = match[1];
                var tableName = match[2];
                return [serviceName, tableName, moment().format("DD-MMM-YYYY"), 'csv'].join('.');
            } else {
                return "";
            }
        };

        var getCSVContents = function() {
            var DELIMITER = ',',
                NEW_LINE = '\n';

            var escapeString = function (string) {
                return '"' + string + '"';
            };

            var getCSVHeaders = function() {
                var headers = [escapeString($scope.resourceBundle.dataElement)];
                if ($scope.isCategoryPresent)
                    headers.push(escapeString($scope.resourceBundle.category));
                _.each($scope.periods, function (period) {
                    var month = $scope.resourceBundle[$scope.data.metaData.names[period].split(' ')[0]];
                    var year = $scope.data.metaData.names[period].split(' ')[1];
                    var name = _.isUndefined(month) ? $scope.data.metaData.names[period] : month + ' ' + year;

                    if ($scope.showWeeks) {
                        var numberofWeeks = getNumberOfISOWeeksInMonth(period);
                        headers.push(escapeString(name + " (" + numberofWeeks + " " + $scope.resourceBundle.weeksLabel + ")"));
                    } else {
                        headers.push(escapeString(name));
                    }
                });
                return headers.join(DELIMITER);
            };
            var getCSVData = function () {
                var sortedViewMap;
                if($scope.selectedSortKey == DEFAULT_SORT_KEY) {
                    sortedViewMap = _.sortBy($scope.viewMap, DEFAULT_SORT_KEY);
                } else {
                    var ascOrDesc = $scope.definition.sortAscending ? 'asc' : 'desc';
                    sortedViewMap = _.sortByOrder($scope.viewMap, [$scope.selectedSortKey, DEFAULT_SORT_KEY], [ascOrDesc, 'asc']);
                }
                var dataValues = [];
                _.each(sortedViewMap, function(datum) {
                    if ($scope.isCategoryPresent) {
                        _.each(getSortedCategories(), function(category) {
                            var value = [];
                            value.push(escapeString($scope.getDataElementName(datum.dataElementName)));
                            value.push(escapeString(category.name));
                            _.each($scope.periods, function(period) {
                                value.push($scope.getValue(category.id, datum.dataElement, period));
                            });
                            dataValues.push(value.join(DELIMITER));
                        });
                    } else {
                        var value = [];
                        value.push(escapeString($scope.getDataElementName(datum.dataElementName)));
                        _.each($scope.periods, function(period) {
                            value.push($scope.getValue(datum.category, datum.dataElement, period));
                        });
                        dataValues.push(value.join(DELIMITER));
                    }
                });
                return dataValues.join(NEW_LINE);
            };

            return [getCSVHeaders(), getCSVData()].join(NEW_LINE);
        };

        $scope.exportToCSV = function () {
            filesystemService.promptAndWriteFile(getCsvFileName(), new Blob([getCSVContents()], {type: 'text/csv'}), filesystemService.FILE_TYPE_OPTIONS.CSV);
        };

        $scope.getDataElementName = function(dataElementName) {
            return dataElementName.split(" - ")[0];
        };

        $scope.getDataValue = function (rowDataValuesFilter, columnDataValuesFilter) {
            var dataValue = _.find($scope.table.dataValues, _.merge({}, rowDataValuesFilter, columnDataValuesFilter));
            return dataValue && dataValue.value;
        };

        $scope.sortByColumn = function (column) {
            var sumOfDataValues = function (row) {
                return _.sum(_.filter($scope.table.dataValues, _.merge({}, row.dataValuesFilter, column.dataValuesFilter)), 'value');
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

        var getNumberOfISOWeeksInMonth = function (period) {
            var m = moment(period, 'YYYYMM');

            var year = parseInt(m.format('YYYY'));
            var month = parseInt(m.format('M')) - 1;
            var day = 1,
                mondays = 0;

            var date = new Date(year, month, day);

            while (date.getMonth() == month) {
                if (date.getDay() === 1) {
                    mondays += 1;
                    day += 7;
                } else {
                    day++;
                }
                date = new Date(year, month, day);
            }
            return mondays;
        };

        $scope.getNumberOfWeeksLabel = function (period) {
            return '[' + getNumberOfISOWeeksInMonth(period) + ' ' + $scope.resourceBundle.weeksLabel + ']';
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