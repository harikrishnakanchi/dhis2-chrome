define(['platformUtils', 'moment', 'properties', 'lodash'], function (platformUtils, moment, properties, _) {
    return function ($scope, $q, $location, $log, systemInfoService, metadataDownloader, changeLogRepository, packagedDataImporter) {
        var retries = 0, updated;

        var setDownloadStartTime = function () {
            return systemInfoService.getServerDate().then(function(serverDate) {
                updated = serverDate;
            });
        };

        var downloadMetadata = function () {
            var success = function () {
                $log.info('Metadata download complete');
            };

            var promptForManualRetry = function () {
                retries = 0;
                $scope.maxRetriesExceeded = true;
                return $q.reject();
            };

            var failure = function () {
                retries++;
                return (retries < properties.metaDataRetryLimit) ? downloadMetadata() : promptForManualRetry();
            };

            var notify = function (data) {
                $scope.progress = data;
            };

            $scope.maxRetriesExceeded = false;
            return setDownloadStartTime().then(function() {
                return metadataDownloader.run().then(success, failure, notify);
            });
        };

        $scope.supportEmail = properties.support_email;

        var updateChangeLog = function () {
            var entities = ['metaData', 'orgUnits', 'orgUnitGroups', 'datasets', 'programs'];
            return $q.all(_.map(entities, _.partial(changeLogRepository.upsert, _, updated)));
        };

        var redirectToLogin = function () {
            $location.path('/login');
        };

        $scope.downloadAndUpsertMetadata = function () {
            return downloadMetadata().then(updateChangeLog).then(redirectToLogin);
        };

        var init = function () {
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
