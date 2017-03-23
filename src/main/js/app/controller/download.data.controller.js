define(["moment", "properties", "lodash", "platformUtils", "hustlePublishUtils"], function(moment, properties, _, platformUtils, hustlePublishUtils) {
    return function($scope, $hustle, $q) {
        $scope.syncNow = function() {

            var onSuccess = function() {
                platformUtils.createNotification($scope.resourceBundle.downloadDataFromDhis, $scope.resourceBundle.syncScheduled);
            };

            var downloadMetadata = function () {
                return $hustle.publishOnce({
                    type: 'downloadMetadata',
                    data: [],
                    locale: $scope.locale
                }, 'dataValues');
            };

            var downloadProjectData = function () {
                return hustlePublishUtils.publishDownloadProjectData($hustle, $scope.locale);
            };

            return $q.all([
                downloadMetadata(),
                downloadProjectData()
            ]).then(onSuccess);
        };
    };
});
