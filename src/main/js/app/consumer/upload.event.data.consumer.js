define(["moment", "dateUtils", "properties"], function(moment, dateUtils, properties) {
    return function(eventService, programEventRepository, userPreferenceRepository, $q) {
        var changeEventLocalStatus = function(eventPayload) {
            var updatedEvents = _.map(eventPayload.events, function(event) {
                return _.omit(event, "localStatus");
            });

            return programEventRepository.upsert(updatedEvents);
        };

        var uploadEventData = function(orgUnitIds) {
            var getEvents = function() {
                var m = moment();
                var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                return programEventRepository.getEventsFromPeriod(startPeriod, orgUnitIds).then(function(events) {
                    return _.filter(events, function(e) {
                        return e.localStatus === "READY_FOR_DHIS";
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
            return userPreferenceRepository.getOriginOrgUnitIds().then(function(originOrgUnitIds) {
                return uploadEventData(originOrgUnitIds);
            });
        };
    };
});
