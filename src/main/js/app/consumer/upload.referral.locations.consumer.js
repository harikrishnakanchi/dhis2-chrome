define(["lodash", "moment"], function(_, moment) {
    return function($q, dataStoreService, referralLocationsRepository, orgUnitRepository) {
        this.run = function(message) {
            var opUnitId = message.data.data;
            var getParentProjectPromise = orgUnitRepository.getParentProject(opUnitId).then(_.property('id'));
            return $q.all({
                remoteReferralLocations: getParentProjectPromise.then(_.partialRight(dataStoreService.getReferrals, opUnitId)),
                localReferralLocations: referralLocationsRepository.get(opUnitId),
                projectId: getParentProjectPromise
            }).then(function(data) {
                var projectId = data.projectId;
                var remoteReferralLocations = data.remoteReferralLocations;
                if (!remoteReferralLocations) {
                    return dataStoreService.createReferrals(projectId, opUnitId, data.localReferralLocations);
                } else {
                    var epoch = '1970-01-01',
                        localTime = moment(_.get(data, 'localReferralLocations.clientLastUpdated', epoch)),
                        remoteTime = moment(_.get(remoteReferralLocations, 'clientLastUpdated'));

                    return localTime.isAfter(remoteTime) ?
                        dataStoreService.updateReferrals(projectId, opUnitId, data.localReferralLocations) :
                        referralLocationsRepository.upsert(remoteReferralLocations);
                }
            });
        };
    };
});
