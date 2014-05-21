    define(["lodash"], function(_) {
        return function($scope, $q, dataService, $rootScope) {
            var dataValues = [];

            var onSuccess = function(response) {
                $scope.isSyncRunning = false;
                $scope.isSyncDone = true;
            };

            $scope.syncNow = function() {
                $scope.isSyncRunning = true;
                dataService.downloadAllData($rootScope.currentUser.organisationUnits[0].id).then(onSuccess);
            };
        };
    });