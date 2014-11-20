define(["moment", "lodash"], function(moment, _) {
    return function(db) {

        var updatePeriod = function(eventsPayload) {
            _.each(eventsPayload.events, function(event) {
                event.period = event.period || moment(event.eventDate).year() + "W" + moment(event.eventDate).isoWeek();
            });
            return eventsPayload;
        };

        this.upsert = function(eventsPayload) {
            eventsPayload = updatePeriod(eventsPayload);
            var store = db.objectStore("programEvents");
            return store.upsert(eventsPayload.events).then(function() {
                return eventsPayload;
            });
        };

        this.getEventsFromPeriod = function(startPeriod) {
            var endPeriod = moment().year() +"W"+ moment().week();

            var store = db.objectStore('programEvents');
            var query = db.queryBuilder().$between(startPeriod, endPeriod).$index("by_period").compile();
            return store.each(query).then(function(eventData) {
                return eventData;
            });
        };

        this.getLastUpdatedPeriod = function() {
            var store = db.objectStore('programEvents');
            return store.getAll().then(function(allEvents) {
                if (_.isEmpty(allEvents)) {
                    return "1900W01";
                }
                return _.first(_.sortBy(allEvents, 'period').reverse()).period;
            });
        };

        this.delete = function(eventId) {
            var store = db.objectStore("programEvents");
            return store.delete(eventId);
        };
    };
});