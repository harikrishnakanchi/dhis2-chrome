define(["lodash", "moment"], function(_, moment) {
    return function($scope, $rootScope, translationsService, filesystemService) {
        $scope.resourceBundle = $rootScope.resourceBundle;
        var DEFAULT_SORT_KEY = 'dataElementIndex';
        var CHART_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY HH[:]mm A";

        $scope.showDownloadButton = $scope.disableDownload != 'true';

        var getCsvFileName = function() {
            var formatDate = function (date) {
                date = date || moment();
                return moment(date, CHART_LAST_UPDATED_TIME_FORMAT).format("DD-MMM-YYYY");
            };

            var regex = /^\[FieldApp - ([a-zA-Z0-9()><]+)\]\s([a-zA-Z0-9\s]+)/;
            var match = regex.exec($scope.definition.name);
            if (match) {
                var serviceName = match[1];
                var tableName = match[2];
                var updatedTimeDetails = $scope.updatedTime ? ['updated', formatDate($scope.updatedTime)] : [formatDate()];
                return _.flatten([serviceName, tableName, updatedTimeDetails, 'csv']).join('.');
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

        $scope.getValue = function(category, dataElement, period) {
            var allValues = _.find($scope.dataMap, function(data) {
                if (data.category === category && data.dataElement === dataElement && data.period === period)
                    return true;
                else
                    return false;
            });

            var value = allValues !== undefined ? allValues.value : undefined;

            if(_.isUndefined($scope.periodBasedValues[period]))
                $scope.periodBasedValues[period] = value;

            return value;
        };

        $scope.sortByColumn = function (subHeader) {
            if (subHeader && $scope.selectedSortKey != subHeader.sortKey) {
                var sortKeyNegator = $scope.definition.sortAscending ? '+' : '-';
                $scope.selectedSortKey = subHeader.sortKey;
                $scope.orderBySortKeys = [sortKeyNegator + subHeader.sortKey, DEFAULT_SORT_KEY];
            } else {
                $scope.selectedSortKey = DEFAULT_SORT_KEY;
                $scope.orderBySortKeys = [DEFAULT_SORT_KEY];
            }
        };
        $scope.sortByColumn();

        var getDefaultSortOrder = function(dataElementId) {
            var dataElementSortOrder,
                sortedDataElements = [];

            if (!_.isUndefined($scope.definition.dataDimensionItems)) {
                _.each($scope.definition.dataDimensionItems, function(dimensionItem) {
                    var id = _.isUndefined(dimensionItem.indicator) ? dimensionItem.dataElement.id : dimensionItem.indicator.id;
                    sortedDataElements.push(id);
                });
                dataElementSortOrder = _.indexOf(sortedDataElements, dataElementId) + 1;
            } else {
                sortedDataElements = _.pluck($scope.definition.dataElements.length === 0 ? $scope.definition.indicators : $scope.definition.dataElements, "id");
                dataElementSortOrder = _.indexOf(sortedDataElements, dataElementId) + 1;
            }

            return dataElementSortOrder;
        };

        var getDataMap = function() {
            return _.map($scope.data.rows, function(row) {
                var map = {};

                var dimensionIndex = _.findIndex($scope.data.headers, {
                    "name": "dx"
                });
                map.dataElement = row[dimensionIndex];

                var periodIndex = _.findIndex($scope.data.headers, {
                    "name": "pe"
                });
                map.period = row[periodIndex];

                var valueIndex = _.findIndex($scope.data.headers, {
                    "name": "value"
                });
                map.value = parseFloat(row[valueIndex]);

                var categoryIndex = _.findIndex($scope.data.headers, function(item) {
                    return item.name !== "dx" && item.name !== "pe" && item.name !== "value";
                });
                if (categoryIndex != -1)
                    map.category = row[categoryIndex];

                return map;
            });
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

        if ($scope.definition && $scope.data) {

            $scope.viewMap = [];
            $scope.periodBasedValues = {};
            $scope.periods = $scope.data.metaData.pe;
            $scope.isCategoryPresent = $scope.data.width === 4;
            $scope.showWeeks = $scope.definition.monthlyReport;
            var items = $scope.definition.rows[0].items;
            $scope.elements = _.groupBy(items, 'id');
            var dataElements;

            var periodsForHeader = _.map($scope.periods, function(pe) {
                var month = $scope.resourceBundle[$scope.data.metaData.names[pe].split(' ')[0]];
                var year = $scope.data.metaData.names[pe].split(' ')[1];
                var name = _.isUndefined(month) ? $scope.data.metaData.names[pe] : month + ' ' + year;
                return {
                    "period": pe,
                    "name": name,
                    "sortKey": "sortKey_" + pe,
                    "numberOfISOWeeks": $scope.showWeeks ? getNumberOfISOWeeksInMonth(pe) : ''
                };
            });
            $scope.headersForTable = [{
                "showHeader": true,
                "headers": periodsForHeader
            }];

            var getSortedCategories = function() {
                var translatedCategoryOptions = translationsService.translate($scope.definition.categoryDimensions[0].categoryOptions);
                return _.map(translatedCategoryOptions, function(categoryOption, index) {
                    return {
                        "name": categoryOption.name,
                        "sortOrder": index + 1,
                        "id": categoryOption.id,
                        "code": categoryOption.code
                    };
                });
            };

            if ($scope.isCategoryPresent) {
                var sortedCategories = getSortedCategories();
                var indexedSortedCategories = _.indexBy(sortedCategories, 'id');

                $scope.hasOnlyOneCategory = sortedCategories.length === 1;
                var sortedCategoryNamesForDisplay = [];

                _.each($scope.periods, function(pe) {
                    _.each(sortedCategories, function(category) {
                        sortedCategoryNamesForDisplay.push({
                            "period": pe,
                            "name": category.name,
                            "category": category.id,
                            "sortKey": "sortKey_" + pe
                        });

                    });
                });

                $scope.headersForTable.push({
                    "showHeader": !$scope.hasOnlyOneCategory,
                    "headers": sortedCategoryNamesForDisplay
                });
            }
            $scope.dataMap = getDataMap();

            dataElements = _.uniq(_.pluck($scope.dataMap, "dataElement"));


            _.each(dataElements, function(dataElementId) {

                var sortKeysAndValues = {};
                _.each($scope.periods, function (period) {
                    var filteredObjects = _.filter($scope.dataMap, function(data) {
                         return data.dataElement === dataElementId && data.period === period;
                    });
                    var filteredExcludedCategoryOptions = _.filter(filteredObjects, function(data){
                        if(data.category) {
                         var categoryOption = indexedSortedCategories[data.category];
                         return !(categoryOption && categoryOption.code && categoryOption.code.indexOf("_excludeFromTotal") > -1);
                        }
                        return true;
                    });
                    var dataValues = _.map(filteredExcludedCategoryOptions, function (dataValue) {
                        return dataValue.value;
                    });
                    sortKeysAndValues['sortKey_' + period] = _.reduce(dataValues, function(previous, current) {
                        return previous + current;
                    }, 0);
                });

                var element = _.first($scope.elements[dataElementId]);
                var dataElementInfo = {
                    "dataElement": dataElementId,
                    "dataElementName": (element && element.name),
                    "dataElementDescription": (element && element.description) ? element.description : ''
                };
                dataElementInfo[DEFAULT_SORT_KEY] = getDefaultSortOrder(dataElementId);

                $scope.viewMap.push(_.merge(dataElementInfo, sortKeysAndValues));
            });

            $scope.maxColumnsHeader = _.last($scope.headersForTable);
        }
    };
});