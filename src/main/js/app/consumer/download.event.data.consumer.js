define(["moment", "properties", "dateUtils", "lodash"], function(moment, properties, dateUtils, _) {
    return function(eventService, programEventRepository, userPreferenceRepository, $q) {
        var mergeAndSave = function(response) {
            var dhisEventList = response[0];
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
            _.map(eventsToUpsert, function(ev) {
                ev.eventDate = moment(ev.eventDate).toISOString();
            });

            var upsertPromise = programEventRepository.upsert(eventsToUpsert);

            var deletePromise = programEventRepository.delete(_.pluck(eventsToDelete, 'event'));

            return $q.all([upsertPromise, deletePromise]);
        };

        var downloadEventsData = function(orgUnitIds) {
            var events = [];

            var onSuccess = function(data) {
                events.push(data);
                return recursivelyDownload();
            };

            var onFailure = function() {
                return recursivelyDownload();
            };

            var recursivelyDownload = function() {
                if (_.isEmpty(orgUnitIds))
                    return $q.when([]);
                var orgUnitId = orgUnitIds.pop();
                return programEventRepository.isDataPresent(orgUnitId).then(function(data) {
                    var startDate = data ? dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSync) : dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSyncOnFirstLogIn);
                    return eventService.getRecentEvents(startDate, orgUnitId).then(onSuccess, onFailure);
                });
            };

            return recursivelyDownload().then(function() {
                events = _.reject(events, function(d) {
                    return d.events === undefined;
                });
                return _.flatten(_.pluck(_.flatten(events), 'events'));
            });

        };

        var getLocalData = function(orgUnitIds) {
            var m = moment();
            var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
            return programEventRepository.getEventsFromPeriod(startPeriod, orgUnitIds);
        };

        this.run = function() {
            return userPreferenceRepository.getOriginOrgUnitIds().then(function(originOrgUnitIds) {
                return $q.all([downloadEventsData(_.clone(originOrgUnitIds, true)), getLocalData(originOrgUnitIds)]).then(mergeAndSave);
            });
        };
    };
});