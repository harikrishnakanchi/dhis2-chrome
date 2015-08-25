define(["lodash"], function(_) {
    return function(systemSettingService, orgUnitRepository, referralLocationsRepository, userPreferenceRepository, mergeBy, $q) {
    	var BATCH_SIZE = 20;

        this.run = function(message) {
        	return getOpUnitIds().then(function(allOpUnitIds){
        		 var promises = [];
        		 var batches = _.chunk(allOpUnitIds, BATCH_SIZE);
        		 _.forEach(batches, function(opUnitIds){
        		 	promises.push(downloadReferralLocations(opUnitIds).then(mergeAndSave));
        		 });
        		 return $q.all(promises);
        	});
        };

        var getOpUnitIds = function() {
            return userPreferenceRepository.getCurrentUserOperationalUnits().then(function(opUnits) {
                if(_.isEmpty(opUnits)) {
                    return orgUnitRepository.getAllOperationUnits().then(function(opUnits){
                        return _.pluck(opUnits, "id");
                    });
                } else {
                    return _.pluck(opUnits, "id");
                }
            });
        };

    	var mergeAndSave = function(remoteReferralLocations) {
    		if(remoteReferralLocations.length === 0) return;

            var remoteIds = _.pluck(remoteReferralLocations, "id");

            var mergeOpts = {
                remoteTimeField: "clientLastUpdated",
                localTimeField: "clientLastUpdated"
            };

            return referralLocationsRepository.findAll(remoteIds).then(function(localReferralLocations) {
                var mergedReferralLocations = mergeBy.lastUpdated(mergeOpts, remoteReferralLocations, localReferralLocations);
                return referralLocationsRepository.upsert(mergedReferralLocations);
            });
    	};

        var downloadReferralLocations = function(opUnitIds){
        	return systemSettingService.getReferralLocations(opUnitIds);
        };
    };
});