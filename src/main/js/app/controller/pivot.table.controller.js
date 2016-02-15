define(["lodash", "moment"], function(_, moment) {
    return function($scope, resourceBundleService) {

        $scope.resourceBundle = resourceBundleService.getBundle();

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
            var sortedViewMap = _.sortBy($scope.viewMap, $scope.sortOrder);
            if($scope.reverseSort()) {
                sortedViewMap = sortedViewMap.reverse();
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
            _.each($scope.periods, function(period) {
                headers.push($scope.data.metaData.names[period]);
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

            var value = allValues !== undefined ? allValues.value : 0;

            $scope.periodBasedValues[period] = $scope.periodBasedValues[period] || value;

            return value;
        };

        var defaultSortOrder = 'dataElementIndex';
        $scope.sortOrder = defaultSortOrder;

        $scope.reverseSort = function () {
            return $scope.definition.sortDescending && $scope.sortOrder != defaultSortOrder;
        };

        $scope.sortByColumn = function (period) {
            if(!$scope.definition.sortable) return;
            if (period) {
                period = 'sortKey_' + period;
                $scope.sortOrder = $scope.sortOrder == period ? defaultSortOrder : period;
            } else {
                $scope.sortOrder = defaultSortOrder;
            }
        };

        var getSortOrder = function(dataElementId) {
            var dataElementSortOrder = 0;
            var sortedDataElements = [];

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

        if ($scope.definition && $scope.data) {

            $scope.viewMap = [];
            $scope.periodBasedValues = {};
            $scope.periods = $scope.data.metaData.pe;
            $scope.isCategoryPresent = $scope.data.width === 4;
            var dataElements;

            _.each($scope.periods, function(period) {
                $scope.periodBasedValues[period] = 0;
            });

            var periodsForHeader = _.map($scope.periods, function(pe) {
                return {
                    "period": pe,
                    "name": $scope.data.metaData.names[pe],
                    "sortKey": "sortKey_" + pe
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
                var sortedCategoriesIds = _.pluck(sortedCategories, "id");

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

                var periodsAndValues = {};
                _.each($scope.periods, function (period) {
                    var filteredObjects = _.filter($scope.dataMap, function(data) {
                         return data.dataElement === dataElementId && data.period === period;
                    });
                    period = 'sortKey_' + period;
                    var dataValues = _.map(filteredObjects, function (dataValue) {
                        return dataValue.value;
                    });
                    periodsAndValues[period] = _.reduce(dataValues, function(previous, current) {
                        return previous + current;
                    }, 0);
                });

                var viewMapIncludingPeriodsAndValues = _.merge({
                    "dataElement": dataElementId,
                    "dataElementName": $scope.data.metaData.names[dataElementId],
                    "dataElementIndex": getSortOrder(dataElementId)
                }, periodsAndValues);

                $scope.viewMap.push(viewMapIncludingPeriodsAndValues);
            });

            $scope.maxColumnsHeader = _.last($scope.headersForTable);
        }
    };
});