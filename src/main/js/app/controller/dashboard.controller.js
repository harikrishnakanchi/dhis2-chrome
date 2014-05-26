    define(["lodash"], function(_) {
        return function($scope, $q, dataSetRepository, dataRepository, dataService, $rootScope) {
            var dataValues = [];

            $scope.syncNow = function() {
                $scope.isSyncRunning = true;

                var onSuccess = function(response) {
                    $scope.isSyncRunning = false;
                    $scope.isSyncDone = true;
                };

                var getAllDataValues = function(allDataSets) {
                    return dataService.downloadAllData($rootScope.currentUser.organisationUnits[0].id, allDataSets);
                };

                var saveAllDataValues = function(data) {
                    return dataRepository.save(data);
                };
                dataSetRepository.getAll().then(getAllDataValues).then(saveAllDataValues).then(onSuccess);
            };
        };
    });