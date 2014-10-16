define([], function() {
    return function($scope, $hustle, $q, $rootScope, approvalHelper) {
        var dataValues = [];

        $scope.syncNow = function() {
            $scope.isSyncRunning = true;

            var onSuccess = function(response) {
                $scope.isSyncRunning = false;
                $scope.isSyncDone = true;
            };

            var downloadData = $hustle.publish({
                "type": "downloadData"
            }, "dataValues");

            return downloadData.then(onSuccess);
        };
    };
});