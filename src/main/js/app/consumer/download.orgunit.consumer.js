define(['moment', "lodash"], function(moment, _) {
    return function(orgUnitService, orgUnitRepository, $q) {
        this.run = function(message) {
            console.debug("Syncing org unit: ", message.data.data);
            var orgUnits = _.isArray(message.data.data) ? message.data.data : [message.data.data];
            var orgUnitSyncPromises = _.map(orgUnits, function(ou) {
                return downloadAndMerge(message.created, ou);
            });
            return $q.all(orgUnitSyncPromises);
        };

        var downloadAndMerge = function(messageCreatedAt, orgUnitFromHustle) {
            var merge = function(data) {
                var orgUnitFromDHIS = data.data.organisationUnits;
                var lastUpdatedOnDhis = _.pluck(orgUnitFromDHIS.attributeValues, "lastUpdated");
                lastUpdatedOnDhis.push(orgUnitFromDHIS.lastUpdated);

                var hustleCreatedDate = moment(messageCreatedAt);

                if (isLocalDataStale(lastUpdatedOnDhis, hustleCreatedDate)) {
                    console.error("Your local changes will be overridden");
                    return orgUnitRepository.upsert([orgUnitFromDHIS]);
                }

                return orgUnitService.upsert(orgUnitFromHustle);
            };

            var isLocalDataStale = function(lastUpdatedOnDhis, hustleCreatedDate) {
                return _.some(lastUpdatedOnDhis, function(l) {
                    return moment(l).isAfter(hustleCreatedDate);
                });
            };

            var onGetFail = function(data) {
                if (data.status === 404) {
                    return orgUnitService.upsert(orgUnitFromHustle);
                }
            };

            return orgUnitService.get(orgUnitFromHustle.id).then(merge, onGetFail);
        };
    };
});
