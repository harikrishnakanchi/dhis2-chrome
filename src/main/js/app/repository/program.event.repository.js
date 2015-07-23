define(["moment", "lodash", "properties", "dateUtils"], function(moment, _, properties, dateUtils) {
    return function(db, $q) {
        this.upsert = function(events) {

            var extractEventCode = function(events) {

                var getEventCodeDataElementIds = function() {
                    var store = db.objectStore("dataElements");
                    var uniqueDataElementIds = _.uniq(_.flatten(_.pluck(_.flatten(_.pluck(events, 'dataValues')), 'dataElement')));
                    var query = db.queryBuilder().$in(uniqueDataElementIds).compile();
                    return store.each(query).then(function(dataElements) {
                        return _.pluck(_.filter(dataElements, function(dataElement) {
                            return _.endsWith(dataElement.code, '_code');
                        }), "id");
                    });
                };

                var mergeEventCodesIntoEvents = function(dataElementsForEventCode) {
                    return _.map(events, function(ev) {
                        var dataElementContainingEventCode = _.find(ev.dataValues, function(dv) {
                            return _.contains(dataElementsForEventCode, dv.dataElement);
                        });
                        if (dataElementContainingEventCode)
                            ev.eventCode = dataElementContainingEventCode.value;
                        return ev;
                    });
                };

                return getEventCodeDataElementIds()
                    .then(mergeEventCodesIntoEvents);
            };

            var extractPeriod = function(events) {
                return _.map(events, function(ev) {
                    ev.period = ev.period || moment(ev.eventDate).format("GGGG[W]WW");
                    return ev;
                });
            };

            var doUpsert = function(events) {
                var store = db.objectStore("programEvents");
                return store.upsert(events);
            };

            events = _.flatten([events]);
            return extractEventCode(events)
                .then(extractPeriod)
                .then(doUpsert);
        };

        this.markEventsAsSubmitted = function(eventIds) {
            eventIds = _.flatten([eventIds]);

            var getEvents = function(eventIds) {
                var store = db.objectStore("programEvents");
                var query = db.queryBuilder().$in(eventIds).compile();
                return store.each(query);
            };

            var markEvents = function(events) {
                return _.map(events, function(e) {
                    e.localStatus = "READY_FOR_DHIS";
                    return e;
                });
            };

            var saveEvents = function(updatedEvents) {
                var store = db.objectStore('programEvents');
                return store.upsert(updatedEvents).then(function() {
                    return updatedEvents;
                });
            };

            return getEvents(eventIds)
                .then(markEvents)
                .then(saveEvents);
        };

        this.delete = function(eventIds) {
            eventIds = _.flatten([eventIds]);

            var store = db.objectStore("programEvents");
            return $q.all(_.map(eventIds, function(id) {
                return store.delete(id);
            }));
        };

        this.getEventsForUpload = function(eventIds) {
            var store = db.objectStore("programEvents");
            var query = db.queryBuilder().$in(eventIds).compile();
            return store.each(query);
        };

        this.getEventsFromPeriod = function(startPeriod, orgUnitIds) {
            var startDate = moment(startPeriod, 'GGGG[W]W').startOf('day').toISOString();
            var endDate = moment().endOf('day').toISOString();

            var store = db.objectStore('programEvents');
            var query = db.queryBuilder().$between(startDate, endDate).$index("by_event_date").compile();
            return store.each(query).then(function(events) {
                return _.filter(events, function(e) {
                    return _.contains(orgUnitIds, e.orgUnit);
                });
            });
        };

        this.isDataPresent = function(orgUnitId) {
            var query = db.queryBuilder().$eq(orgUnitId).$index("by_organisationUnit").compile();
            var store = db.objectStore('programEvents');
            return store.exists(query).then(function(data) {
                return data;
            });
        };

        this.getEventsForPeriod = function(programId, orgUnitIds, period) {
            orgUnitIds = _.flatten([orgUnitIds]);

            var getEvents = function() {
                var store = db.objectStore('programEvents');
                var queryPromises = _.transform(orgUnitIds, function(acc, orgUnitId) {
                    var query = db.queryBuilder().$eq([programId, orgUnitId, dateUtils.getFormattedPeriod(period)]).$index("by_program_orgunit_period").compile();
                    acc.push(store.each(query));
                }, []);
                return $q.all(queryPromises).then(function(data) {
                    return _.flatten(data);
                });
            };

            return getEvents().then(_.curry(enrichEvents)(programId));
        };

        this.getSubmitableEventsFor = function(programId, orgUnitIds) {
            orgUnitIds = _.flatten([orgUnitIds]);

            var getEvents = function() {
                var store = db.objectStore('programEvents');
                var queryPromises = _.transform(orgUnitIds, function(acc, orgUnitId) {
                    var newDraftQuery = db.queryBuilder().$eq([programId, orgUnitId, "NEW_DRAFT"]).$index("by_program_orgunit_status").compile();
                    acc.push(store.each(newDraftQuery));
                    var updatedDraftQuery = db.queryBuilder().$eq([programId, orgUnitId, "UPDATED_DRAFT"]).$index("by_program_orgunit_status").compile();
                    acc.push(store.each(updatedDraftQuery));
                }, []);
                return $q.all(queryPromises).then(function(data) {
                    return _.flatten(data);
                });
            };

            return getEvents().then(_.curry(enrichEvents)(programId));
        };

        this.getDraftEventsFor = function(programId, orgUnitIds) {
            orgUnitIds = _.flatten([orgUnitIds]);

            var getEvents = function() {
                var store = db.objectStore('programEvents');
                var queryPromises = _.transform(orgUnitIds, function(acc, orgUnitId) {
                    var newDraftQuery = db.queryBuilder().$eq([programId, orgUnitId, "NEW_INCOMPLETE_DRAFT"]).$index("by_program_orgunit_status").compile();
                    acc.push(store.each(newDraftQuery));
                    var updatedDraftQuery = db.queryBuilder().$eq([programId, orgUnitId, "UPDATED_INCOMPLETE_DRAFT"]).$index("by_program_orgunit_status").compile();
                    acc.push(store.each(updatedDraftQuery));
                }, []);
                return $q.all(queryPromises).then(function(data) {
                    return _.flatten(data);
                });
            };

            return getEvents().then(_.curry(enrichEvents)(programId));
        };

        this.findEventById = function(programId, eventId) {
            var getEvent = function(eventId) {
                var store = db.objectStore("programEvents");
                return store.find(eventId);
            };

            return getEvent(eventId).then(_.curry(enrichEvents)(programId));
        };

        this.findEventsByCode = function(programId, orgUnitIds, eventCode) {
            eventCode = _.trim(eventCode);
            if (_.isEmpty(eventCode)) {
                return $q.when([]);
            }

            orgUnitIds = _.flatten([orgUnitIds]);

            var getEvents = function() {
                var store = db.objectStore('programEvents');
                var query = db.queryBuilder().$eq(eventCode).$index("by_event_code").compile();
                return store.each(query);
            };

            var filterEvents = function(events) {
                return _.filter(events, function(e) {
                    return e.program == programId && _.contains(orgUnitIds, e.orgUnit);
                });
            };

            return getEvents().then(filterEvents).then(_.curry(enrichEvents)(programId));
        };

        this.findEventsByDateRange = function(programId, orgUnitIds, fromDate, toDate) {
            fromDate = moment(fromDate).startOf('day').toISOString();
            toDate = moment(toDate).endOf('day').toISOString();

            orgUnitIds = _.flatten([orgUnitIds]);

            var getEvents = function() {
                var store = db.objectStore('programEvents');
                var query = db.queryBuilder().$between(fromDate, toDate).$index("by_event_date").compile();
                return store.each(query);
            };

            var filterEvents = function(events) {
                return _.filter(events, function(e) {
                    return e.program == programId && _.contains(orgUnitIds, e.orgUnit);
                });
            };

            return getEvents().then(filterEvents).then(_.curry(enrichEvents)(programId));
        };

        var enrichEvents = function(programId, events) {

            events = _.isArray(events) ? events : [events];

            var getProgramDataElements = function(programId) {
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

                var getDataElementIds = function(programStages) {
                    var programStageSections = _.flatten(_.pluck(programStages, "programStageSections"));
                    var programStageDataElements = _.flatten(_.pluck(programStageSections, "programStageDataElements"));
                    var dataElements = _.pluck(programStageDataElements, "dataElement");
                    return _.pluck(dataElements, "id");
                };


                return getProgram().then(getProgramStages).then(function(programStages) {
                    var store = db.objectStore("dataElements");
                    var dataElementIds = getDataElementIds(programStages);

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

            return getProgramDataElements(programId).then(function(programDataElements) {
                return _.transform(events, function(acc, programEvent) {
                    if (programEvent.localStatus === "DELETED")
                        return false;
                    var mappedEvent = _.omit(programEvent, "dataValues");
                    mappedEvent.dataValues = _.cloneDeep(programDataElements);
                    _.each(programEvent.dataValues, function(programEventDataValue) {
                        var mappedEventDataValue = _.find(mappedEvent.dataValues, {
                            'dataElement': programEventDataValue.dataElement
                        });
                        mappedEventDataValue.value = programEventDataValue.value;
                    });
                    acc.push(mappedEvent);
                }, []);
            });
        };
    };
});
