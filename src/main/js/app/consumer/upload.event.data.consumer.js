define(["moment"], function(moment) {
    return function(eventService, programEventRepository, $q) {

        var changeEventLocalStatus = function(eventPayload) {
            var updatedEvents = _.map(eventPayload.events, function(event) {
                return _.omit(event, "localStatus");
            });

            return programEventRepository.upsert({
                "events": updatedEvents
            });
        };

        var uploadEventData = function() {
            var getEvents = function() {
                return programEventRepository.getLastUpdatedPeriod().then(function(lastUpdatedPeriod) {
                    return programEventRepository.getEventsFromPeriod(lastUpdatedPeriod).then(function(events) {
                        return _.filter(events, function(e) {
                            return e.localStatus === "NEW";
                        });
                    });
                });
            };

            return getEvents().then(function(events) {
                eventService.upsertEvents({
                    'events': events
                }).then(changeEventLocalStatus);
            });
        };

        this.run = function(message) {
            return uploadEventData();
        };
    };
});