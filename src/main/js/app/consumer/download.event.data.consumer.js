define(["moment", "properties", "dateUtils", "lodash"], function(moment, properties, dateUtils, _) {
    return function(eventService, programEventRepository, $q) {
        var mergeAndSave = function(response) {
            var dhisEventList = response[0].events;
            var dbEventList = response[1];

            var getNewEvents = function() {
                return _.reject(dhisEventList, function(dhisEvent) {
                    return _.any(dbEventList, {
                        "event": dhisEvent.event
                    });
                });
            };

            if (_.isEmpty(dhisEventList) && _.isEmpty(dbEventList))
                return;

            var eventsToUpsert = [];
            var eventsToDelete = [];

            _.each(dbEventList, function(dbEvent) {
                if (!_.isEmpty(dbEvent.localStatus))
                    return;

                var dhisEvent = _.find(dhisEventList, {
                    "event": dbEvent.event
                });

                if (dhisEvent) {
                    eventsToUpsert.push(dhisEvent);
                } else {
                    eventsToDelete.push(dbEvent);
                }
            });

            var newEvents = getNewEvents();
            eventsToUpsert = eventsToUpsert.concat(newEvents);

            var upsertPromise = programEventRepository.upsert({
                'events': eventsToUpsert
            });

            var deletePromise = programEventRepository.delete(_.pluck(eventsToDelete, 'event'));

            return $q.all([upsertPromise, deletePromise]);
        };

        var downloadEventsData = function() {
            return programEventRepository.isDataPresent().then(function(areEventsPresent) {
                var startDate = areEventsPresent ? dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSync) : dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSyncOnFirstLogIn);
                return eventService.getRecentEvents(startDate);
            });
        };

        var getLocalData = function() {
            var m = moment();
            var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
            return programEventRepository.getEventsFromPeriod(startPeriod);
        };

        this.run = function() {
            return $q.all([downloadEventsData(), getLocalData()]).then(mergeAndSave);
        };
    };
});
