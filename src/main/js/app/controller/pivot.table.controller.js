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
            var sortedViewMap = _.sortBy($scope.viewMap, "sortOrder");
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

        var getSortOrder = function(dataElementId, categoryId) {
            var categorySortOrder = 0.0;
            var dataElementSortOrder = 0;
            var sortedDataElements = [];
            if (categoryId) {
                var sortedCategories = _.pluck(_.flatten(_.pluck($scope.definition.categoryDimensions, "categoryOptions")), "id");
                categorySortOrder = (_.indexOf(sortedCategories, categoryId) + 1) * 0.1;
            }

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


            return dataElementSortOrder + categorySortOrder;
        };

        var getDataMap = function(categoryIds) {
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
            $scope.isCategoryPresent = $scope.data.width === 4 ? true : false;
            var dataElements;

            _.each($scope.periods, function(period) {
                $scope.periodBasedValues[period] = 0;
            });

            var periodsForHeader = _.map($scope.periods, function(pe) {
                return {
                    "period": pe,
                    "name": $scope.data.metaData.names[pe]
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
                            "category": category.id
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

            _.each(dataElements, function(dataElement) {
                $scope.viewMap.push({
                    "dataElement": dataElement,
                    "dataElementName": $scope.data.metaData.names[dataElement],
                    "sortOrder": getSortOrder(dataElement)
                });
            });

            $scope.maxColumnsHeader = _.last($scope.headersForTable);
        }
    };
});