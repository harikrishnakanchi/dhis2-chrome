define([], function() {
    return function(eventService, programEventRepository) {

        var saveAllEvents = function(dhisEventList) {

            var mergeAndSave = function(dbEventList) {
            	if (_.isEmpty(dhisEventList) && _.isEmpty(dbEventList))
                    return;

                var updatePromises = [];
                
                _.each(dbEventList, function(dbEvent) {
                    if (dbEvent.status === "NEW")
                        return;

                    var dhisEvent = _.find(dhisEventList, {
                        "id": dbEvent.event
                    });

                    var updatePromise = dhisEvent ? programEventRepository.upsert(dhisEvent) : programEventRepository.delete(dbEvent.event);
                    updatePromises.push(updatePromise);
                });

                var newApprovals = _.reject(dhisEventList, function(dhisEvent) {
                    return _.any(dbEventList, {
                        "event": dhisEvent.id
                    });
                });
                var approvalPromise = programEventRepository.upsert(newApprovals);
                updatePromises.push(approvalPromise);

                return $q.all[updatePromises];
            };

            programEventRepository.getEvents().then(mergeAndSave);
        };

        var downloadEventsData = function() {
            return eventService.getRecentEvents().then(saveAllEvents);
        };

        this.run = function() {
            return downloadEventsData();
        };
    };
});