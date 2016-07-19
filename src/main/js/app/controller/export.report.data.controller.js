define(["lodash"], function (_) {
    return function($scope) {
        $scope.weekRanges = [{
            "label": $scope.resourceBundle.lastOneWeek,
            "value": 1
        }, {
            "label": $scope.resourceBundle.lastFourWeeks,
            "value": 4
        }, {
            "label": $scope.resourceBundle.lastEightWeeks,
            "value": 8
        }, {
            "label": $scope.resourceBundle.lastTwelveWeeks,
            "value": 12
        }]; 
    };
});
