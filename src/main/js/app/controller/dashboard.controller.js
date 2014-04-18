define(["lodash"], function(_) {
    return function($scope, $q, dataService) {
        var dataValues = [];
        var DATA_SETS = ["DS_OPD", "DS_VS", "DS_ITFC", "DS_ATFC", "DS_Physio"];
        var ORG_UNIT = "proj_104";

        var onSuccess = function(response) {
            $scope.isSyncRunning = false;
            $scope.isSyncDone = true;
        };

        var saveToDb = function(response) {
            return dataService.parseAndSave(response.dataValues, ORG_UNIT);
        };

        $scope.syncNow = function() {
            $scope.isSyncRunning = true;
            dataService.get(ORG_UNIT, DATA_SETS).then(saveToDb).then(onSuccess);
        };
    };
});