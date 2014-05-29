    define([], function() {
        return function($scope, $hustle, $q) {
            var dataValues = [];

            $scope.syncNow = function() {
                $scope.isSyncRunning = true;

                var onSuccess = function(response) {
                    $scope.isSyncRunning = false;
                    $scope.isSyncDone = true;
                };

                var downloadDataValues = $hustle.publish({
                    "type": "downloadDataValues"
                }, "dataValues");

                var downloadApprovalData = $hustle.publish({
                    "type": "downloadApprovalData"
                }, "dataValues");

                return $q.all([downloadDataValues, downloadApprovalData]).then(onSuccess);
            };
        };
    });