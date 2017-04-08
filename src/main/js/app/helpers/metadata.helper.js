define(["lodash"], function (_) {
    return function ($q, changeLogRepository, systemSettingRepository) {
        this.checkMetadata = function () {
            var checkForLastUpdated = function (changeLogKey) {
                return changeLogRepository.get(changeLogKey).then(function (lastUpdated) {
                    return !lastUpdated ? $q.reject('noMetadata') : $q.when();
                });
            };
            return checkForLastUpdated('metaData').then(function () {
                var productKeyLevel = systemSettingRepository.getProductKeyLevel();
                if (productKeyLevel !== 'global') {
                    var allowedOrgUnitChangeLogKeys = _.map(systemSettingRepository.getAllowedOrgUnits() || [], function (orgUnit) {
                        return "organisationUnits:" + orgUnit.id;
                    });
                    return $q.all(_.map(allowedOrgUnitChangeLogKeys, checkForLastUpdated));
                }
                else {
                    return checkForLastUpdated('organisationUnits');
                }
            });
        };
    };
});