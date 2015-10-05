define(["lodash"], function(_) {
    return function($scope) {

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
                    value["Category"] = $scope.data.metaData.names[datum.category];
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
                return headers.push($scope.data.metaData.names[period]);
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

            return value;
        };

        var getSortOrder = function(dataElement) {
            var elementsToSort = $scope.definition.dataElements.length === 0 ? $scope.definition.indicators : $scope.definition.dataElements;
            return _.indexOf(_.pluck(elementsToSort, "id"), dataElement) + 1;
        };

        var getDataMap = function(categoryIds) {
            return _.map($scope.data.rows, function(row) {
                if (_.isUndefined(categoryIds)) {
                    return {
                        "dataElement": row[0],
                        "period": row[1],
                        "value": parseInt(row[2])
                    };
                } else {
                    var category, dataElement;
                    category = _.contains(categoryIds, row[0]) ? row[0] : row[1];
                    dataElement = _.contains(categoryIds, row[0]) ? row[1] : row[0];

                    return {
                        "category": category,
                        "dataElement": dataElement,
                        "period": row[2],
                        "value": parseInt(row[3])
                    };
                }
            });
        };


        if ($scope.definition && $scope.data) {

            $scope.viewMap = [];
            $scope.periods = $scope.data.metaData.pe;
            $scope.isCategoryPresent = $scope.data.width === 4 ? true : false;
            var dataElements;

            if ($scope.isCategoryPresent) {
                var sortedCategories = _.map($scope.definition.categoryDimensions[0].categoryOptions, function(categoryOption, index) {
                    return {
                        "sortOrder": index + 1,
                        "id": categoryOption.id
                    };
                });

                var sortedCategoriesIds = _.pluck(sortedCategories, "id");

                $scope.dataMap = getDataMap(sortedCategoriesIds);

                dataElements = _.uniq(_.pluck($scope.dataMap, "dataElement"));

                _.each(sortedCategoriesIds, function(categoryId) {
                    _.each(dataElements, function(dataElement) {
                        $scope.viewMap.push({
                            "category": categoryId,
                            "dataElement": dataElement,
                            "dataElementName": $scope.data.metaData.names[dataElement],
                            "sortOrder": getSortOrder(dataElement),
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
