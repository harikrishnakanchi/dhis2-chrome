define(["lodash"], function(_) {
    return function($q, systemSettingService, userPreferenceRepository, referralLocationsRepository, patientOriginRepository, excludedDataElementsRepository) {
        this.run = function() {
            return getUserProjectIds()
                .then(downloadedProjectSettings)
                .then(function(projectSettings) {
                    return $q.all([saveReferrals(projectSettings), savePatientOriginDetails(projectSettings), saveExcludedDataElements(projectSettings)]);
                });
        };

        var getUserProjectIds = function() {
            return userPreferenceRepository.getCurrentUsersProjectIds();
        };

        var downloadedProjectSettings = function(projectIds) {
            if (_.isEmpty(projectIds))
                return;

            return systemSettingService.getProjectSettings(projectIds);
        };

        var saveReferrals = function(projectSettings) {
            var referrals = _.transform(projectSettings, function(result, settings) {
                _.each(settings.referralLocations, function(item) {
                    result.push(item);
                });
            }, []);

            if (_.isEmpty(referrals))
                return;

            return referralLocationsRepository.upsert(referrals);
        };

        var savePatientOriginDetails = function(projectSettings) {
            var patientOrigins = _.transform(projectSettings, function(result, settings) {
                _.each(settings.patientOrigins, function(item) {
                    result.push(item);
                });
            }, []);

            if (_.isEmpty(patientOrigins))
                return;

            return patientOriginRepository.upsert(patientOrigins);
        };

        var saveExcludedDataElements = function(projectSettings) {
            var excludedDataElements = _.transform(projectSettings, function(result, settings) {
                _.each(settings.excludedDataElements, function(item) {
                    result.push(item);
                });
            }, []);

            if (_.isEmpty(excludedDataElements))
                return;

            return excludedDataElementsRepository.upsert(excludedDataElements);
        };

    };
});
