define([], function() {
    return function(systemSettingService, referralLocationsRepository) {
        var run = function(message) {
        	var opUnitId = message.data.data;
        	return referralLocationsRepository.get(opUnitId).then(systemSettingService.upsertReferralLocations);
        };

        return {
            "run": run
        };
    };
});