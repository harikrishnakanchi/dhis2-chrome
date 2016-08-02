define(['chromeUtils', 'interpolate', 'lodash'], function(chromeUtils, interpolate, _) {
    return function ($rootScope, $scope, systemSettingRepository) {
        $scope.versionAndConnectionMessage = function () {
            var versionAndConnectionMessage = _.get($scope.resourceBundle, 'versionAndConnectionMessage'),
                praxisVersion = chromeUtils.getPraxisVersion(),
                dhisUrl = systemSettingRepository.getDhisUrl();

            if(!versionAndConnectionMessage || !praxisVersion || !dhisUrl) return;

            return interpolate(versionAndConnectionMessage, {
                praxis_version: praxisVersion,
                dhis_url: dhisUrl
            });
        };
    };
});