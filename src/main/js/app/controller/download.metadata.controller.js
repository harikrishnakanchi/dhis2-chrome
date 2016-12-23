define(['platformUtils', 'moment'], function (platformUtils, moment) {
    return function ($scope, $location, metadataDownloader, changeLogRepository, packagedDataImporter) {

        var downloadMetadata = function () {
            return metadataDownloader.run().then(function () {
                console.log('Metadata download complete');
            }, null, function (data) {
                $scope.progress = data;
            });
        };

        var initializeBackgroundAndRedirect = function () {
            platformUtils.sendMessage("dbReady");
            $location.path('/login');
        };

        var init = function () {
            switch(platformUtils.platform) {
                case 'web':
                    $scope.showProgressBar = true;
                    return downloadMetadata().then(function () {
                        changeLogRepository.upsert('metaData', moment().toISOString())
                            .then(initializeBackgroundAndRedirect);
                    });
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
