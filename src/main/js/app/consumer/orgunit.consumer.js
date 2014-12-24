define(['moment'], function(moment) {
    return function(orgUnitService, orgUnitRepository) {
        this.run = function(message) {
            console.debug("Creating org unit: ", message.data.data);
            return downloadAndMerge(message);
        };

        var downloadAndMerge = function(message) {
            var merge = function(orgUnit) {
                var lastUpdatedOnDhis = _.pluck(orgUnit.attributeValues, "lastUpdated");
                lastUpdatedOnDhis.push(orgUnit.lastUpdated);

                var hustleCreatedDate = moment(message.created);

                if (isLocalDataStale(lastUpdatedOnDhis, hustleCreatedDate)) {
                    console.error("Your local changes will be overridden");
                    return orgUnitRepository.upsert([orgUnit]);
                }

                return orgUnitService.upsert(message.data.data);
            };

            var isLocalDataStale = function(lastUpdatedOnDhis, hustleCreatedDate) {
                return _.some(lastUpdatedOnDhis, function(lastUpdated) {
                    return moment(lastUpdated).isAfter(hustleCreatedDate);
                });
            };

            var onGetFail = function(data) {
                if (data.status === 404) {
                    return orgUnitService.upsert(message.data.data);
                }
            };

            return orgUnitService.get(message.data.data.id).then(merge, onGetFail);
        };
    };
});
