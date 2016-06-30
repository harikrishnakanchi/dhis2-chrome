define(['chromeUtils', 'lodash'], function(chromeUtils, _) {
    return function ($rootScope, $scope, $interpolate, systemSettingRepository) {
        $scope.versionAndConnectionMessage = function () {
            var versionAndConnectionMessage = _.get($scope.resourceBundle, 'versionAndConnectionMessage');
            if(!versionAndConnectionMessage) return;

            var interpolatedMessage = $interpolate(versionAndConnectionMessage, false, null, true);
            return interpolatedMessage({
                praxis_version: chromeUtils.getPraxisVersion(),
                dhis_url: systemSettingRepository.getDhisUrl()
            });
        };
    };
});