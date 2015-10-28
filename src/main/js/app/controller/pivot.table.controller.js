define(["lodash", "moment"], function(_, moment) {
    return function($scope) {

        $scope.getCsvFileName = function() {
            var regex = /^\[FieldApp - ([a-zA-Z0-9><]+)\]\s([a-zA-Z0-9\s]+)/;
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
                var value = {};
                value["Data Element"] = $scope.getDataElementName($scope.data.metaData.names[datum.dataElement]);
                if ($scope.isCategoryPresent) {
                    value.Category = $scope.data.metaData.names[datum.category];
                }
                _.each($scope.periods, function(period) {
                    value[$scope.data.metaData.names[period]] = $scope.getValue(datum.category, datum.dataElement, period);
                });
                dataValues.push(value);
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
            if (categoryId) {
                var sortedCategories = _.pluck(_.flatten(_.pluck($scope.definition.categoryDimensions, "categoryOptions")), "id");
                categorySortOrder = (_.indexOf(sortedCategories, categoryId) + 1) * 0.1;
            }

            var sortedDataElements = _.pluck($scope.definition.dataElements.length === 0 ? $scope.definition.indicators : $scope.definition.dataElements, "id");
            var dataElementSortOrder = _.indexOf(sortedDataElements, dataElementId) + 1;

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

            if ($scope.isCategoryPresent) {
                var sortedCategories = _.map($scope.definition.categoryDimensions[0].categoryOptions, function(categoryOption, index) {
                    return {
                        "sortOrder": index + 1,
                        "id": categoryOption.id
                    };
                });

                $scope.hasOnlyOneCategory = sortedCategories.length === 1;
                var sortedCategoriesIds = _.pluck(sortedCategories, "id");

                $scope.dataMap = getDataMap(sortedCategoriesIds);

                dataElements = _.uniq(_.pluck($scope.dataMap, "dataElement"));

                _.each(sortedCategoriesIds, function(categoryId) {
                    _.each(dataElements, function(dataElement) {
                        $scope.viewMap.push({
                            "category": categoryId,
                            "dataElement": dataElement,
                            "dataElementName": $scope.data.metaData.names[dataElement],
                            "sortOrder": getSortOrder(dataElement, categoryId),
                        });
                    });
                });
            } else {
                $scope.dataMap = getDataMap();

                dataElements = _.uniq(_.pluck($scope.dataMap, "dataElement"));

                _.each(dataElements, function(dataElement) {
                    $scope.viewMap.push({
                        "dataElement": dataElement,
                        "dataElementName": $scope.data.metaData.names[dataElement],
                        "sortOrder": getSortOrder(dataElement),
                    });
                });
            }

        }
    };
});
