define(["moment", "dateUtils", "properties"], function(moment, dateUtils, properties) {
    return function(eventService, programEventRepository, $q) {

        var changeEventLocalStatus = function(events) {
            var updatedEvents = _.map(events, function(ev) {
                return _.omit(ev, ["localStatus", "clientLastUpdated"]);
            });

            return programEventRepository.upsert(updatedEvents);
        };

        var uploadEventData = function(events) {
            var eventsPayload = {
                'events': events
            };
            return eventService.upsertEvents(eventsPayload).then(function() {
                return events;
            });
        };

        this.run = function(message) {
            var eventIds = message.data.data;
            return programEventRepository.getEventsForUpload(eventIds)
                .then(uploadEventData)
                .then(changeEventLocalStatus);
        };
    };
});
