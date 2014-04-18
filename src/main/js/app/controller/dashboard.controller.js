define(["lodash"], function(_) {
    return function($scope, $q, dataService) {
        var dataValues = [];

        var getValues = function(dataset) {
            return dataService.get("proj_104", dataset).then(successCallback);
        };

        var successCallback = function(response) {
            dataValues = dataValues.concat(response.dataValues);
            $scope.isSyncRunning = false;
            $scope.isSyncDone = true;
        };

        $scope.syncNow = function() {
            $scope.isSyncRunning = true;
            var datasets = ["DS_OPD", "DS_VS", "DS_ITFC", "DS_ATFC", "DS_Physio"];

            $q.all(_.map(datasets, function(dataset) {
                return getValues(dataset);
            })).then(function(response) {
                dataService.parseAndSave(dataValues);
            });
        };
    };
});