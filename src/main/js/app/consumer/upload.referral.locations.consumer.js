define(["lodash"], function(_) {
    return function($q, systemSettingService, referralLocationsRepository, orgUnitRepository) {
        this.run = function(message) {
            var opUnitId = message.data.data;
            var parentProjectPromise = orgUnitRepository.getParentProject(opUnitId);
            var referralLocationsPromise = referralLocationsRepository.get(opUnitId);
            return $q.all([parentProjectPromise, referralLocationsPromise]).then(function(data) {
                var projectId = data[0].id;
                var updatedReferralLocations = data[1];
                return systemSettingService.upsertReferralLocations(projectId, updatedReferralLocations);
            });
        };
    };
});
