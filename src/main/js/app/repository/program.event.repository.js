define(["moment", "lodash"], function(moment, _) {
    return function(db, $q) {

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
            var endPeriod = moment().year() + "W" + moment().week();
            var store = db.objectStore('programEvents');
            var query = db.queryBuilder().$between(startPeriod, endPeriod).$index("by_period").compile();
            return store.each(query);
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

        this.getEventsFor = function(programId, period, orgUnit) {

            var getProgram = function() {
                var store = db.objectStore('programs');
                return store.find(programId);
            };


            var getProgramStages = function(program) {
                var store = db.objectStore('programStages');
                var programStageIds = _.pluck(program.programStages, "id");
                return $q.all(_.map(programStageIds, function(programStageId) {
                    return store.find(programStageId);
                }));
            };

            var getDataElements = function() {
                return getProgram().then(getProgramStages).then(function(programStages) {
                    var store = db.objectStore("dataElements");
                    var dataElementIds = _.pluck(_.flatten(_.flatten(_.flatten(programStages, 'programStageSections'), 'programStageDataElements'), 'dataElement'), 'id');
                    
                    return $q.all(_.map(dataElementIds, function(dataElementId) {
                        return store.find(dataElementId).then(function(dataElement) {
                            var attr = _.find(dataElement.attributeValues, {
                                "attribute": {
                                    "code": 'showInEventSummary'
                                }
                            });

                            if ((!_.isEmpty(attr)) && attr.value === "true") {
                                dataElement.showInEventSummary = true;
                            } else {
                                dataElement.showInEventSummary = false;
                            }
                            dataElement.dataElement = dataElement.id;
                            return _.omit(dataElement, ["id", "attributeValues"]);
                        });
                    }));
                });
            };

            var getEvents = function() {
                var store = db.objectStore('programEvents');
                var query = db.queryBuilder().$eq([programId, period, orgUnit]).$index("by_program_period_orgunit").compile();
                return store.each(query);
            };

            return $q.all([getDataElements(), getEvents()]).then(function(data) {
                var dataElements = data[0];
                var events = data[1];

                return _.map(events, function(programEvent) {                    
                    var mappedEvent = _.omit(programEvent, "dataValues");
                    mappedEvent.dataValues = _.cloneDeep(dataElements);
                    _.each(programEvent.dataValues, function(programEventDataValue) {
                        var mappedEventDataValue = _.find(mappedEvent.dataValues, {
                            'dataElement': programEventDataValue.dataElement
                        });
                        mappedEventDataValue.value = programEventDataValue.value;
                    });
                    console.log(mappedEvent);
                    return mappedEvent;
                });
            });
        };
    };
});