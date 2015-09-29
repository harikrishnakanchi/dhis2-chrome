define(["moment", "properties", "lodash", "chromeUtils"], function(moment, properties, _, chromeUtils) {
    return function($scope, $hustle, $q, $rootScope, $timeout) {
        $scope.syncNow = function() {

            var onSuccess = function(response) {
                chromeUtils.createNotification($scope.resourceBundle.syncScheduledHeader, $scope.resourceBundle.syncScheduled);
            };

            var downloadMetadata = $hustle.publish({
                "type": "downloadMetadata",
                "data": []
            }, "dataValues");

            var downloadProjectData = $hustle.publish({
                "type": "downloadProjectData",
                "data": []
            }, "dataValues");

            return $q.all([
                    downloadMetadata,
                    downloadProjectData
                ])
                .then(onSuccess);
        };
    };
});
