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
                        praxisEventLastUpdated = moment(matchingPraxisEvent.clientLastUpdated || matchingPraxisEvent.lastUpdated),
                        praxisEventHasNoTimestamps = !matchingPraxisEvent.lastUpdated && !matchingPraxisEvent.clientLastUpdated;

                    if(praxisEventHasNoTimestamps || dhisEventLastUpdated.isAfter(praxisEventLastUpdated)) {
                        eventsToUpsert.push(dhisEvent);
                    }
                } else {
                    eventsToUpsert.push(dhisEvent);
                }
            }, []);
        };

        var checkIfEventsHaveBeenModified = function (praxisEvents, eventsToUpsert) {
            var dataValuesAreEqual = function (dataValueA, dataValueB) {
                return dataValueA.dataElement === dataValueB.dataElement && String(dataValueA.value) === String(dataValueB.value);
            };

            var emptyDataValue = function (dataValue) {
                return _.isUndefined(dataValue.value);
            };

            var eventDataValuesAreEqual = function (eventA, eventB) {
                var dataValuesA = _.reject(eventA.dataValues || [], emptyDataValue),
                    dataValuesB = _.reject(eventB.dataValues || [], emptyDataValue);

                return dataValuesA.length === dataValuesB.length && _.all(dataValuesA, function (dataValueA) {
                        return _.any(dataValuesB, function (dataValueB) {
                            return dataValuesAreEqual(dataValueA, dataValueB);
                        });
                    });
            };

            var isNewOrHasBeenModified = function (eventToUpsert) {
                var matchingPraxisEvent = _.find(praxisEvents, { event: eventToUpsert.event});
                return !matchingPraxisEvent || !eventDataValuesAreEqual(eventToUpsert, matchingPraxisEvent);
            };

            return _.any(eventsToUpsert, isNewOrHasBeenModified);
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
                eventsHaveBeenModified = checkIfEventsHaveBeenModified(praxisEvents, eventsToUpsert),
                eventIdsToDelete = getEventIdsToDelete(praxisEvents, eventIdsFromDhis),
                mergedEvents = getMergedEvents(praxisEvents, eventsToUpsert);

            var praxisEventsAreUpToDate = !eventsHaveBeenModified && _.isEmpty(eventIdsToDelete);
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