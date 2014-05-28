    define([], function() {
        return function($scope, $hustle) {
            var dataValues = [];

            $scope.syncNow = function() {
                $scope.isSyncRunning = true;

                var onSuccess = function(response) {
                    $scope.isSyncRunning = false;
                    $scope.isSyncDone = true;
                };

                return $hustle.publish({
                    "type": "download"
                }, "dataValues").then(onSuccess);
            };
        };
    });