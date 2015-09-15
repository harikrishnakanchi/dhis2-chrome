define(["lodash"], function(_) {
    return function($scope) {

        $scope.getDataElementName = function(dataElementName) {
            return dataElementName.split(" - ")[0];
        };

        $scope.getTableName = function(tableName) {
            return tableName.split("]")[1];
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

        if ($scope.definition && $scope.data) {
            $scope.viewMap = [];
            $scope.periods = $scope.data.metaData.pe;
            $scope.isCategoryPresent = $scope.data.width === 4 ? true : false;
            $scope.showTable = $scope.data.rows.length === 0 ? false : true;

            $scope.dataMap = _.map($scope.data.rows, function(row) {
                return {
                    "category": $scope.isCategoryPresent ? row[0] : undefined,
                    "dataElement": $scope.isCategoryPresent ? row[1] : row[0],
                    "period": $scope.isCategoryPresent ? row[2] : row[1],
                    "value": $scope.isCategoryPresent ? parseInt(row[3]) : parseInt(row[2])
                };
            });

            var categories = _.uniq(_.pluck($scope.dataMap, "category"));
            var dataElements = _.uniq(_.pluck($scope.dataMap, "dataElement"));

            _.each(categories, function(category) {
                _.each(dataElements, function(dataElement) {
                    $scope.viewMap.push({
                        "category": category,
                        "dataElement": dataElement
                    });
                });
            });


            var groupedByCategory = _.groupBy($scope.data, "category");
        }
    };
});
