define(["moment", "properties", "lodash", "platformUtils"], function(moment, properties, _, platformUtils) {
    return function($scope, $hustle, $q, $rootScope, $timeout) {
        $scope.syncNow = function() {

            var onSuccess = function(response) {
                platformUtils.createNotification($scope.resourceBundle.downloadDataFromDhis, $scope.resourceBundle.syncScheduled);
            };

            var downloadMetadata = $hustle.publishOnce({
                type: 'downloadMetadata',
                data: [],
                locale: $scope.locale
            }, 'dataValues');

            var downloadProjectData = $hustle.publishOnce({
                type: 'downloadProjectData',
                data: [],
                locale: $scope.locale
            }, 'dataValues');

            return $q.all([
                    downloadMetadata,
                    downloadProjectData
                ])
                .then(onSuccess);
        };
    };
});
