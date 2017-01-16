define(['platformUtils', 'moment', 'properties'], function (platformUtils, moment, properties) {
    return function ($scope, $q, $location, $log, metadataDownloader, changeLogRepository, packagedDataImporter) {
        var retries = 0, updated;

        var downloadMetadata = function () {
            updated = moment().toISOString();
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
            return metadataDownloader.run().then(success, failure, notify);
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
