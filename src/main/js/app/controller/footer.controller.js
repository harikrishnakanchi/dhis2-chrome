define(['interpolate', 'lodash'], function(interpolate, _) {
    return function ($rootScope, $scope, systemSettingRepository) {
        $scope.connectionMessage = function () {
            var connectionMessage = _.get($scope.resourceBundle, 'connectionMessage'),
                dhisUrl = systemSettingRepository.getDhisUrl();

            if(!connectionMessage || !dhisUrl) return;

            return interpolate(connectionMessage, {
                dhis_url: dhisUrl
            });
        };
    };
});