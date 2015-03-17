define(["moment", "dateUtils", "properties"], function(moment, dateUtils, properties) {
    return function(eventService, programEventRepository, userPreferenceRepository, $q) {
        var changeEventLocalStatus = function(eventPayload) {
            var updatedEvents = _.map(eventPayload.events, function(event) {
                return _.omit(event, "localStatus");
            });

            return programEventRepository.upsert({
                "events": updatedEvents
            });
        };

        var uploadEventData = function(moduleIds) {
            var getEvents = function() {
                var m = moment();
                var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                return programEventRepository.getEventsFromPeriod(startPeriod, moduleIds).then(function(events) {
                    return _.filter(events, function(e) {
                        return e.localStatus === "NEW";
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
            return userPreferenceRepository.getUserModuleIds().then(function(moduleIds) {
                return uploadEventData(moduleIds);
            });
        };
    };
});
