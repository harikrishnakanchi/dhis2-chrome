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

            var upsertPromise = programEventRepository.upsert({
                'events': eventsToUpsert
            });

            var deletePromise = programEventRepository.delete(_.pluck(eventsToDelete, 'event'));

            return $q.all([upsertPromise, deletePromise]);
        };

        var downloadEventsData = function(orgUnitIds) {
            var downloadPromises = _.map(orgUnitIds, function(orgUnitId) {
                return programEventRepository.isDataPresent(orgUnitId).then(function(data) {
                    var startDate = data ? dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSync) : dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSyncOnFirstLogIn);
                    return eventService.getRecentEvents(startDate, orgUnitId);
                });
            });
            return $q.all(downloadPromises).then(function(data) {
                data = _.reject(data, function(d) {
                    return d.events === undefined;
                });
                return _.flatten(_.pluck(_.flatten(data), 'events'));
            });
        };

        var getLocalData = function(orgUnitIds) {
            var m = moment();
            var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
            return programEventRepository.getEventsFromPeriod(startPeriod, orgUnitIds);
        };

        this.run = function() {
            return userPreferenceRepository.getUserModuleIds().then(function(moduleIds) {
                return $q.all([downloadEventsData(moduleIds), getLocalData(moduleIds)]).then(mergeAndSave);
            });
        };
    };
});
