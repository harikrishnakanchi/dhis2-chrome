define(["moment", "properties", "lodash", "platformUtils", "hustlePublishUtils"], function(moment, properties, _, platformUtils, hustlePublishUtils) {
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

            var downloadProjectData = hustlePublishUtils.publishDownloadProjectData($hustle, $scope.locale);

            return $q.all([
                    downloadMetadata,
                    downloadProjectData
                ])
                .then(onSuccess);
        };
    };
});
