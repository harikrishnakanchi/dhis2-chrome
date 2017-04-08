define(["lodash"], function (_) {
    return function ($q, changeLogRepository, systemSettingRepository) {
        this.checkMetadata = function () {
            return changeLogRepository.get('metaData').then(function (lastUpdated) {
                if (!lastUpdated)
                    return $q.reject('noMetadata');
                var productKeyLevel = systemSettingRepository.getProductKeyLevel();
                if (productKeyLevel !== 'global') {
                    var allowedOrgUnitChangeLogKeys = _.map(systemSettingRepository.getAllowedOrgUnits() || [], function (orgUnit) {
                        return "organisationUnits:" + orgUnit.id;
                    });
                    return $q.all(_.map(allowedOrgUnitChangeLogKeys, changeLogRepository.get));
                }
            });
        };
    };
});