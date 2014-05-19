    define(["lodash"], function(_) {
        return function($scope, $q, dataService, $rootScope) {
            var dataValues = [];

            var onSuccess = function(response) {
                $scope.isSyncRunning = false;
                $scope.isSyncDone = true;
            };

            var saveToDb = function(response) {
                return dataService.saveToDb(response.dataValues, $rootScope.currentUser.organisationUnits[0].id);
            };

            $scope.syncNow = function() {
                $scope.isSyncRunning = true;
                dataService.get($rootScope.currentUser.organisationUnits[0].id).then(saveToDb).then(onSuccess);
            };
        };
    });