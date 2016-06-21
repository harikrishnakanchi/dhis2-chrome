define(['chromeUtils'], function(chromeUtils) {
    return function ($rootScope, $scope, $interpolate, systemSettingRepository) {
        $scope.$watch('resourceBundle.versionAndConnectionMessage', function (versionAndConnectionMessage) {
            if(!versionAndConnectionMessage) return;

            var interpolatedMessage = $interpolate(versionAndConnectionMessage, false, null, true);
            $scope.versionAndConnectionMessage = interpolatedMessage({
                praxis_version: chromeUtils.getPraxisVersion(),
                dhis_url: systemSettingRepository.getDhisUrl()
            });
        });
    };
});