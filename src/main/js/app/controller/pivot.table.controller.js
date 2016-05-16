define(["lodash", "moment"], function(_, moment) {
    return function($scope, $rootScope) {
        $scope.resourceBundle = $rootScope.resourceBundle;
        var DEFAULT_SORT_KEY = 'dataElementIndex';

        $scope.showDownloadButton = $scope.disableDownload != 'true';

        $scope.getCsvFileName = function() {
            var regex = /^\[FieldApp - ([a-zA-Z0-9()><]+)\]\s([a-zA-Z0-9\s]+)/;
            var match = regex.exec($scope.definition.name);
            if (match) {
                var serviceName = match[1];
                var tableName = match[2];
                return serviceName + "_" + tableName + "_" + moment().format("DD-MMM-YYYY") + ".csv";
            } else {
                return "";
            }
        };

        $scope.getDataElementName = function(dataElementName) {
            return dataElementName.split(" - ")[0];
        };

        $scope.getData = function() {
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
                        var value = {};
                        value["Data Element"] = $scope.getDataElementName($scope.data.metaData.names[datum.dataElement]);
                        value.Category = $scope.data.metaData.names[category.id];
                        _.each($scope.periods, function(period) {
                            value[$scope.data.metaData.names[period]] = $scope.getValue(category.id, datum.dataElement, period);
                        });
                        dataValues.push(value);
                    });
                } else {
                    var value = {};
                    value["Data Element"] = $scope.getDataElementName($scope.data.metaData.names[datum.dataElement]);
                    _.each($scope.periods, function(period) {
                        value[$scope.data.metaData.names[period]] = $scope.getValue(datum.category, datum.dataElement, period);
                    });
                    dataValues.push(value);
                }
            });
            return dataValues;

        };

        $scope.getHeaders = function() {
            var headers = ["Data Element"];
            if ($scope.isCategoryPresent)
                headers.push("Category");
            _.each($scope.periods, function (period) {
                var month = $scope.data.metaData.names[period];
                if ($scope.showWeeks) {
                    var numberofWeeks = getNumberOfISOWeeksInMonth(period);
                    headers.push(month + " (" + numberofWeeks + " " + $scope.resourceBundle.weeksLabel + ")");
                } else {
                    headers.push(month);
                }
            });
            return headers;
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
            var dataElements;

            var periodsForHeader = _.map($scope.periods, function(pe) {
                return {
                    "period": pe,
                    "name": $scope.data.metaData.names[pe],
                    "sortKey": "sortKey_" + pe,
                    "numberOfISOWeeks": $scope.showWeeks ? getNumberOfISOWeeksInMonth(pe) : ''
                };
            });
            $scope.headersForTable = [{
                "showHeader": true,
                "headers": periodsForHeader
            }];

            var getSortedCategories = function() {
                return _.map($scope.definition.categoryDimensions[0].categoryOptions, function(categoryOption, index) {
                    return {
                        "name": categoryOption.name,
                        "sortOrder": index + 1,
                        "id": categoryOption.id
                    };
                });
            };

            if ($scope.isCategoryPresent) {
                var sortedCategories = getSortedCategories();

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
                    var dataValues = _.map(filteredObjects, function (dataValue) {
                        return dataValue.value;
                    });
                    sortKeysAndValues['sortKey_' + period] = _.reduce(dataValues, function(previous, current) {
                        return previous + current;
                    }, 0);
                });

                var dataElementInfo = {
                    "dataElement": dataElementId,
                    "dataElementName": $scope.data.metaData.names[dataElementId]
                };
                dataElementInfo[DEFAULT_SORT_KEY] = getDefaultSortOrder(dataElementId);

                $scope.viewMap.push(_.merge(dataElementInfo, sortKeysAndValues));
            });

            $scope.maxColumnsHeader = _.last($scope.headersForTable);
        }
    };
});