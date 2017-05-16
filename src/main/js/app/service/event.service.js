define(['dhisUrl', 'dateUtils', 'properties', 'moment', 'lodash', 'pagingUtils', 'constants'], function(dhisUrl, dateUtils, properties, moment, _, pagingUtils, constants) {
    return function($http, $q) {
        var MAX_NUMBER_OF_EVENTS = properties.eventsSync.maximumNumberOfEventsToSync,
            EVENT_ID_PAGE_SIZE = properties.eventsSync.pageSize.eventIds,
            EVENT_DATA_PAGE_SIZE = properties.eventsSync.pageSize.eventData;

        this.getEvents = function(orgUnitId, periodRange, lastUpdated) {
            var formatEventDates = function (events) {
                return _.map(events, function(event) {
                    event.eventDate = dateUtils.toISODate(event.eventDate);
                    return event;
                });
            };

            var startDate = moment(_.first(periodRange), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD'),
                endDate = moment(_.last(periodRange), 'GGGG[W]WW').endOf('isoWeek').format('YYYY-MM-DD'),
                maximumPageRequests = MAX_NUMBER_OF_EVENTS / EVENT_DATA_PAGE_SIZE;

            var queryParams = {
                startDate: startDate,
                endDate: endDate,
                orgUnit: orgUnitId,
                ouMode: "DESCENDANTS",
                fields: ":all,dataValues[value,dataElement,providedElsewhere,storedBy]",
                lastUpdated: lastUpdated,
                pageSize: EVENT_DATA_PAGE_SIZE
            };

            return pagingUtils.paginateRequest(getEvents, queryParams, maximumPageRequests, []).then(formatEventDates);
        };

        this.getEventIds = function(orgUnitId, periodRange) {
            var startDate = moment(_.first(periodRange), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD'),
                endDate = moment(_.last(periodRange), 'GGGG[W]WW').endOf('isoWeek').format('YYYY-MM-DD'),
                maximumPageRequests = MAX_NUMBER_OF_EVENTS / EVENT_ID_PAGE_SIZE;

            var queryParams = {
                startDate: startDate,
                endDate: endDate,
                orgUnit: orgUnitId,
                ouMode: "DESCENDANTS",
                fields: "event",
                pageSize: EVENT_ID_PAGE_SIZE
            };

            return pagingUtils.paginateRequest(getEvents, queryParams, maximumPageRequests, []).then(function(events) {
                return _.pluck(events, 'event');
            });
        };

        this.createEvents = function(events) {
            var eventsToUpload = _.map(events, function(event) {
                return _.omit(event, ['period', 'localStatus', 'eventCode', 'clientLastUpdated']);
            });

            return $http.post(dhisUrl.events, { events: eventsToUpload });
        };

        this.updateEvents = function(events) {
            var updateEvent = function(event) {
                return $http.put(dhisUrl.events + '/' + event.event, event);
            };

            return _.reduce(events, function(previousPromises, event) {
                return previousPromises.then(_.partial(updateEvent, event));
            }, $q.when());
        };

        this.deleteEvent = function(eventId) {
            var onSuccess = function(data) {
                return data;
            };
            var onError = function(data) {
                if (data.errorCode !== constants.errorCodes.NOT_FOUND) {
                    return $q.reject(data);
                } else {
                    return $q.when(data);
                }
            };
            return $http.delete(dhisUrl.events + "/" + eventId).then(onSuccess, onError);
        };

        var getEvents = function (queryParams) {
            return $http.get(dhisUrl.events, { params: queryParams }).then(function (response) {
                return {
                    pager: response.data.pager,
                    data: response.data.events
                };
            });
        };
    };
});
