define(["moment", "properties", "dateUtils", "lodash"], function(moment, properties, dateUtils, _) {
    return function(eventService, programEventRepository, userPreferenceRepository, moduleDataBlockMerger, $q) {
        var mergeAndSave = function(response) {
            var dhisEventList = response[0];
            var dbEventList = response[1];

            return moduleDataBlockMerger.mergeAndSaveEventsToLocalDatabase(dbEventList, dhisEventList);
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
            return userPreferenceRepository.getCurrentUsersLineListOriginOrgUnitIds().then(function(originOrgUnitIds) {
                return $q.all([downloadEventsData(_.clone(originOrgUnitIds, true)), getLocalData(originOrgUnitIds)]).then(mergeAndSave);
            });
        };
    };
});