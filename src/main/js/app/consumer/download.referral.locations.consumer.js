define(["lodash"], function(_) {
    return function(systemSettingService, orgUnitRepository, referralLocationsRepository, $q) {
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
            return orgUnitRepository.getAllOperationUnits().then(function(opUnits){
                return _.pluck(opUnits, "id");
            });
        };

    	var mergeAndSave = function(remoteReferralLocations) {
    		if(remoteReferralLocations.length === 0) return;
    		return referralLocationsRepository.upsert(remoteReferralLocations);
    	};

        var downloadReferralLocations = function(opUnitIds){
        	return systemSettingService.getReferralLocations(opUnitIds);
        };
    };
});