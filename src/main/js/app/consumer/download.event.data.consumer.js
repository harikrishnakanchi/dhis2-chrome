define(["moment"], function(moment) {
    return function(eventService, programEventRepository, $q) {

        var saveAllEvents = function(response) {

            var dhisEventList = response[0].events;
            var dbEventList = response[1];


            if (_.isEmpty(dhisEventList) && _.isEmpty(dbEventList))
                return;

            var updatePromises = [];

            _.each(dbEventList, function(dbEvent) {
                if (dbEvent.localStatus === "NEW" || dbEvent.localStatus === "DELETED")
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

            var newEvents = _.reject(dhisEventList, function(dhisEvent) {
                return _.any(dbEventList, {
                    "event": dhisEvent.event
                });
            });

            var newEventPayload = {
                'events': newEvents
            };

            var approvalPromise = programEventRepository.upsert(newEventPayload);
            updatePromises.push(approvalPromise);

            return $q.all[updatePromises];
        };

        var downloadEventsData = function() {
            return programEventRepository.getLastUpdatedPeriod().then(function(lastUpdatedPeriod) {
                var year = lastUpdatedPeriod.split("W")[0];
                var isoWeek = lastUpdatedPeriod.split("W")[1];
                var startDate = moment().year(year).isoWeek(isoWeek).startOf('week').format("YYYY-MM-DD");
                return $q.all([eventService.getRecentEvents(startDate), programEventRepository.getEventsFromPeriod(lastUpdatedPeriod)]);
            });
        };

        this.run = function() {
            return downloadEventsData().then(saveAllEvents);
        };
    };
});