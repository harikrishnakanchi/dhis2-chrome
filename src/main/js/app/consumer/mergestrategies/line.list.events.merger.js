define(['moment', 'lodash'], function (moment, _) {
    return function () {

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
            return event.clientLastUpdated;
        };

        this.create = function (praxisEvents, updatedEventsFromDhis) {
            praxisEvents = praxisEvents || [];
            updatedEventsFromDhis = updatedEventsFromDhis || [];

            var eventsToUpsert = getEventsToUpsert(praxisEvents, updatedEventsFromDhis),
                mergedEvents = getMergedEvents(praxisEvents, eventsToUpsert);

            var praxisEventsAreUpToDate = _.isEmpty(eventsToUpsert);
            var dhisEventsAreUpToDate = !_.any(mergedEvents, isModifiedOnPraxis);

            return {
                eventsToUpsert: eventsToUpsert,
                praxisAndDhisAreBothUpToDate: praxisEventsAreUpToDate && dhisEventsAreUpToDate,
                dhisIsUpToDateAndPraxisIsOutOfDate: dhisEventsAreUpToDate && !praxisEventsAreUpToDate,
                praxisAndDhisAreBothOutOfDate: !praxisEventsAreUpToDate && !dhisEventsAreUpToDate
            };
        };
    };
});