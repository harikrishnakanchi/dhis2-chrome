define(["lodash"], function(_) {
    return function($q, systemSettingService, userPreferenceRepository, referralLocationsRepository) {
        this.run = function() {
            return getUserProjectIds()
                .then(downloadedProjectSettings)
                .then(saveReferrals);
        };

        var getUserProjectIds = function() {
            return userPreferenceRepository.getCurrentProjects();
        };

        var downloadedProjectSettings = function(projectIds) {
            if (_.isEmpty(projectIds))
                return;

            return systemSettingService.getProjectSettings(projectIds);
        };

        // var mergeAndSave = function(remoteReferralLocations) {
        //     if (remoteReferralLocations.length === 0) return;

        //     var remoteIds = _.pluck(remoteReferralLocations, "id");

        //     var mergeOpts = {
        //         remoteTimeField: "clientLastUpdated",
        //         localTimeField: "clientLastUpdated"
        //     };

        //     return referralLocationsRepository.findAll(remoteIds).then(function(localReferralLocations) {
        //         var mergedReferralLocations = mergeBy.lastUpdated(mergeOpts, remoteReferralLocations, localReferralLocations);
        //         return referralLocationsRepository.upsert(mergedReferralLocations);
        //     });
        // };

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
    };
});
