define(["lodash"], function(_) {
    return function($scope) {

        $scope.getDataElementName = function(dataElementName) {
            return dataElementName.split(" - ")[0];
        };

        $scope.getTableName = function(tableName) {
            return tableName.split("]")[1];
        };

        if ($scope.definition && $scope.data) {
            $scope.periods = $scope.data.metaData.pe;
            $scope.isCategoryPresent = $scope.data.width === 4 ? true : false;
            $scope.showTable = $scope.data.rows.length === 0 ? false : true;

            $scope.dataMap = _.map($scope.data.rows, function(row) {
                return {
                    "category": $scope.isCategoryPresent ? row[0] : undefined,
                    "dataElement": $scope.isCategoryPresent ? row[1] : row[0],
                    "period": $scope.isCategoryPresent ? row[2] : row[1],
                    "value": $scope.isCategoryPresent ? row[3] : row[2]
                };
            });

            var groupedByCategory = _.groupBy($scope.data, "category");
        }
    };
});
