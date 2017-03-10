define(['platformUtils', 'moment', 'properties', 'lodash'], function (platformUtils, moment, properties, _) {
    return function ($scope, $q, $location, $log, metadataDownloader, packagedDataImporter) {
        var retries = 0;

        var downloadMetadata = function () {
            var success = function () {
                $log.info('Metadata download complete');
            };

            var promptForManualRetry = function () {
                retries = 0;
                $scope.maxRetriesExceeded = true;
                return $q.reject();
            };

            var promptForValidProductKey = function () {
                $scope.productKeyExpired = true;
                return $q.reject();
            };

            var failure = function (data) {
                if (data == 'productKeyExpired') {
                    return promptForValidProductKey();
                }
                else {
                    retries++;
                    return (retries < properties.metaDataRetryLimit) ? downloadMetadata() : promptForManualRetry(data);
                }
            };

            var notify = function (data) {
                $scope.progress = data;
            };

            $scope.maxRetriesExceeded = false;

            return metadataDownloader.run().then(success, failure, notify);
        };

        $scope.supportEmail = properties.support_email;

        var redirectToLogin = function () {
            $location.path('/login');
        };

        $scope.redirectToProductKeyPage = function () {
            $location.path('/productKeyPage');
        };

        $scope.downloadAndUpsertMetadata = function () {
            return downloadMetadata().then(redirectToLogin);
        };

        var init = function () {
            $scope.productKeyExpired = false;
            switch(platformUtils.platform) {
                case 'web':
                    $scope.showProgressBar = true;
                    return $scope.downloadAndUpsertMetadata();
                case 'chrome':
                    return packagedDataImporter.run()
                        .then(redirectToLogin);
                default:
                    return;
            }
        };

        init();
    };
});
