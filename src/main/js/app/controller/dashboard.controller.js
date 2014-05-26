    define(["lodash"], function(_) {
        return function($scope, dataValuesService) {
            var dataValues = [];

            $scope.syncNow = function() {
                $scope.isSyncRunning = true;

                var onSuccess = function(response) {
                    $scope.isSyncRunning = false;
                    $scope.isSyncDone = true;
                };

                dataValuesService.sync().then(onSuccess);
            };
        };
    });