define(['moment', 'lodash'], function (moment, _) {
    return function () {

        var dataValuesEquals = function (dataValueA, dataValueB) {
            return dataValueA.dataElement === dataValueB.dataElement && dataValueA.value === dataValueB.value;
        };

        var eventDataValuesAreEqual = function (eventA, eventB) {
            var dataValuesA = eventA.dataValues || [],
                dataValuesB = eventB.dataValues || [];
            return dataValuesA.length === dataValuesB.length && _.all(dataValuesA, function (dataValueA) {
                return _.any(dataValuesB, function (dataValueB) {
                    return dataValuesEquals(dataValueA, dataValueB);
                });
            });
        };

        var getEventIdsToDelete = function(praxisEvents, eventIdsFromDhis) {
            var indexedDhisEventIds = _.indexBy(eventIdsFromDhis, function(eventId) { return eventId; }),
                eventsToDelete = _.reject(praxisEvents, function(praxisEvent) {
                    return praxisEvent.localStatus || indexedDhisEventIds[praxisEvent.event];
                });
            return _.pluck(eventsToDelete, 'event');
        };

        var getEventsToUpsert = function (praxisEvents, updatedEventsFromDhis) {
            var eventsHaveBeenModified = false;

            var eventsToUpsert = _.transform(updatedEventsFromDhis, function (eventsToUpsert, dhisEvent) {
                var matchingPraxisEvent = _.find(praxisEvents, { event: dhisEvent.event });
                if(matchingPraxisEvent) {
                    var dhisEventLastUpdated = moment(dhisEvent.lastUpdated),
                        praxisEventLastUpdated = moment(matchingPraxisEvent.clientLastUpdated || matchingPraxisEvent.lastUpdated),
                        praxisEventHasNoTimestamps = !matchingPraxisEvent.lastUpdated && !matchingPraxisEvent.clientLastUpdated;

                    if(praxisEventHasNoTimestamps || dhisEventLastUpdated.isAfter(praxisEventLastUpdated)) {
                        eventsToUpsert.push(dhisEvent);
                        if(!eventDataValuesAreEqual(dhisEvent, matchingPraxisEvent)) {
                            eventsHaveBeenModified = true;
                        }
                    }
                } else {
                    eventsToUpsert.push(dhisEvent);
                    eventsHaveBeenModified = true;
                }
            }, []);

            return {
                events: eventsToUpsert,
                haveBeenModified: eventsHaveBeenModified
            };
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
                mergedEvents = getMergedEvents(praxisEvents, eventsToUpsert.events);

            var praxisEventsAreUpToDate = !eventsToUpsert.haveBeenModified && _.isEmpty(eventIdsToDelete);
            var dhisEventsAreUpToDate = !_.any(mergedEvents, isModifiedOnPraxis);

            return {
                eventsToUpsert: eventsToUpsert.events,
                eventIdsToDelete: eventIdsToDelete,
                praxisAndDhisAreBothUpToDate: praxisEventsAreUpToDate && dhisEventsAreUpToDate,
                dhisIsUpToDateAndPraxisIsOutOfDate: dhisEventsAreUpToDate && !praxisEventsAreUpToDate,
                praxisAndDhisAreBothOutOfDate: !praxisEventsAreUpToDate && !dhisEventsAreUpToDate
            };
        };
    };
});