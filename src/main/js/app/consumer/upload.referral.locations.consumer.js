define(["lodash", "moment"], function(_, moment) {
    return function($q, dataStoreService, referralLocationsRepository) {
        this.run = function(message) {
            var opUnitId = message.data.data;
            return $q.all({
                remoteReferralLocations: dataStoreService.getReferrals(opUnitId),
                localReferralLocations: referralLocationsRepository.get(opUnitId)
            }).then(function(data) {
                if (!data.remoteReferralLocations) {
                    return dataStoreService.createReferrals(opUnitId, data.localReferralLocations);
                } else {
                    var epoch = '1970-01-01',
                        localTime = moment(_.get(data, 'localReferralLocations.clientLastUpdated', epoch)),
                        remoteTime = moment(_.get(data, 'remoteReferralLocations.clientLastUpdated'));

                    return localTime.isAfter(remoteTime) ?
                        dataStoreService.updateReferrals(opUnitId, data.localReferralLocations) :
                        referralLocationsRepository.upsert(data.remoteReferralLocations);
                }
            });
        };
    };
});
