define(["lodash"], function(_) {
    return function($scope, $q, dataService) {

        $scope.message = "";
        var dataValues = [];

        var getValues = function(dataset) {
            return dataService.fetch("company_0", dataset).then(successCallback);
        };

        var successCallback = function(response) {
            dataValues = dataValues.concat(response.dataValues);
            $scope.message = "Sync success";
        };

        $scope.syncNow = function() {
            $scope.message = "Syncing... Plz Wait...";
            var datasets = ["DS_OPD", "DS_VS", "DS_ITFC", "DS_ATFC", "DS_Physio"];

            $q.all(_.map(datasets, function(dataset) {
                return getValues(dataset);
            })).then(function(response) {
                dataService.parseAndSave(dataValues);
            });
        };
    };
});