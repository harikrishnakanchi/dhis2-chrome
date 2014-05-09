define(["lodash"], function(_) {
    return function($scope, $q, dataService) {
        var dataValues = [];
        var ORG_UNIT = "proj_104";

        var onSuccess = function(response) {
            $scope.isSyncRunning = false;
            $scope.isSyncDone = true;
        };

        var saveToDb = function(response) {
            return dataService.saveToDb(response.dataValues, ORG_UNIT);
        };

        $scope.syncNow = function() {
            $scope.isSyncRunning = true;
            dataService.get(ORG_UNIT).then(saveToDb).then(onSuccess);
        };
    };
});