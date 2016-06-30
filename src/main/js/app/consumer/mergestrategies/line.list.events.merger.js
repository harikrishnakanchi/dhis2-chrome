define(['moment', 'lodash'], function (moment, _) {
    return function () {

        var getEventIdsToDelete = function(praxisEvents, eventIdsFromDhis) {
            var indexedDhisEventIds = _.indexBy(eventIdsFromDhis, function(eventId) { return eventId; }),
                eventsToDelete = _.reject(praxisEvents, function(praxisEvent) {
                return praxisEvent.localStatus || indexedDhisEventIds[praxisEvent.event];
            });
            return _.pluck(eventsToDelete, 'event');
        };

        var getEventsToUpsert = function (praxisEvents, updatedEventsFromDhis) {
            return _.transform(updatedEventsFromDhis, function (eventsToUpsert, dhisEvent) {
                var matchingPraxisEvent = _.find(praxisEvents, { event: dhisEvent.event });
                if(matchingPraxisEvent) {
                    var dhisEventLastUpdated = moment(dhisEvent.lastUpdated),
                        praxisEventLastUpdated = moment(matchingPraxisEvent.clientLastUpdated || matchingPraxisEvent.lastUpdated);

                    if(dhisEventLastUpdated.isAfter(praxisEventLastUpdated)) {
                        eventsToUpsert.push(dhisEvent);
                    }
                } else {
                    eventsToUpsert.push(dhisEvent);
                }
            }, []);
        };

        var getMergedEvents = function (praxisEvents, eventsToUpsert) {
            var allEventsIncludingDuplicates = eventsToUpsert.concat(praxisEvents);
            return _.unique(allEventsIncludingDuplicates, false, 'event');
        };

        var isModifiedOnPraxis = function (event) {
            return _.contains(['READY_FOR_DHIS', 'DELETED'], event.localStatus);
        };

        this.create = function (praxisEvents, updatedEventsFromDhis, eventIdsFromDhis) {
            praxisEvents = praxisEvents || [];
            updatedEventsFromDhis = updatedEventsFromDhis || [];
            eventIdsFromDhis = eventIdsFromDhis || [];

            var eventsToUpsert = getEventsToUpsert(praxisEvents, updatedEventsFromDhis),
                eventIdsToDelete = getEventIdsToDelete(praxisEvents, eventIdsFromDhis),
                mergedEvents = getMergedEvents(praxisEvents, eventsToUpsert);

            var praxisEventsAreUpToDate = _.isEmpty(eventsToUpsert) && _.isEmpty(eventIdsToDelete);
            var dhisEventsAreUpToDate = !_.any(mergedEvents, isModifiedOnPraxis);

            return {
                eventsToUpsert: eventsToUpsert,
                eventIdsToDelete: eventIdsToDelete,
                praxisAndDhisAreBothUpToDate: praxisEventsAreUpToDate && dhisEventsAreUpToDate,
                dhisIsUpToDateAndPraxisIsOutOfDate: dhisEventsAreUpToDate && !praxisEventsAreUpToDate,
                praxisAndDhisAreBothOutOfDate: !praxisEventsAreUpToDate && !dhisEventsAreUpToDate
            };
        };
    };
});