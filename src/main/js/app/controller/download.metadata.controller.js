define(['platformUtils', 'moment', 'properties'], function (platformUtils, moment, properties) {
    return function ($scope, $q, $location, metadataDownloader, changeLogRepository, packagedDataImporter) {
        var retries = 0;

        var downloadMetadata = function () {
            var success = function () {
                console.log('Metadata download complete');
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

        var upsertChangeLog = function () {
            var updated = moment().toISOString();
            var promises = [];
            promises.push(changeLogRepository.upsert('metaData', updated));
            promises.push(changeLogRepository.upsert('orgUnits', updated));
            promises.push(changeLogRepository.upsert('orgUnitGroups', updated));
            promises.push(changeLogRepository.upsert('datasets', updated));
            promises.push(changeLogRepository.upsert('programs', updated));
            return $q.all(promises);
        };

        var initializeBackgroundAndRedirect = function () {
            platformUtils.sendMessage("dbReady");
            $location.path('/login');
        };

        $scope.downloadAndUpsertMetadata = function () {
            return downloadMetadata().then(upsertChangeLog).then(initializeBackgroundAndRedirect);
        };

        var init = function () {
            switch(platformUtils.platform) {
                case 'web':
                    $scope.showProgressBar = true;
                    return $scope.downloadAndUpsertMetadata();
                case 'chrome':
                    return packagedDataImporter.run()
                        .then(initializeBackgroundAndRedirect);
                default:
                    return;
            }
        };

        init();
    };
});
