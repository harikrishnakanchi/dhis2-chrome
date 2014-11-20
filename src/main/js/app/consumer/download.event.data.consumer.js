define([], function() {
    return function(eventService, programEventRepository, $q) {

        var saveAllEvents = function(dhisEventsJson) {

            var dhisEventList = dhisEventsJson.events;

            var mergeAndSave = function(dbEventList) {
                if (_.isEmpty(dhisEventList) && _.isEmpty(dbEventList))
                    return;

                var updatePromises = [];

                _.each(dbEventList, function(dbEvent) {
                    if (dbEvent.status === "NEW")
                        return;

                    var dhisEvent = _.find(dhisEventList, {
                        "event": dbEvent.event
                    });

                    var dhisEventPayload = {
                        'events': [dhisEvent]
                    };

                    var updatePromise = dhisEvent ? programEventRepository.upsert(dhisEventPayload) : programEventRepository.delete(dbEvent.event);
                    updatePromises.push(updatePromise);
                });

                var newApprovals = _.reject(dhisEventList, function(dhisEvent) {
                    return _.any(dbEventList, {
                        "event": dhisEvent.event
                    });
                });

                var newApprovalsPayload = {
                    'events': newApprovals
                };

                var approvalPromise = programEventRepository.upsert(newApprovalsPayload);
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