define(['dhisUrl', 'properties', 'moment', 'lodash'], function(dhisUrl, properties, moment, _) {
    return function($http, $q) {
        var MAX_NUMBER_OF_EVENTS = properties.eventsSync.maximumNumberOfEventsToSync,
            EVENT_ID_PAGE_SIZE = properties.eventsSync.pageSize.eventIds,
            EVENT_DATA_PAGE_SIZE = properties.eventsSync.pageSize.eventData,
            DEFAULT_PAGE_REQUESTS_MAX_LIMIT = 99;

        var recursivelyDownloadPagedEvents = function(queryParams, maximumPageRequests, eventsResponses) {
            queryParams.totalPages = true;
            queryParams.page = queryParams.page || 1;
            eventsResponses = eventsResponses || [];
            maximumPageRequests = maximumPageRequests || DEFAULT_PAGE_REQUESTS_MAX_LIMIT;

            return $http.get(dhisUrl.events, { params: queryParams }).then(function(response) {
                var eventsResponse = response.data.events || [],
                    totalPages = (response.data.pager && response.data.pager.pageCount) || 0,
                    lastPageReached = queryParams.page >= totalPages,
                    pageLimitReached = queryParams.page >= maximumPageRequests;

                eventsResponses.push(eventsResponse);

                if(lastPageReached || pageLimitReached || _.isEmpty(eventsResponse)) {
                    return $q.when(_.flatten(eventsResponses));
                } else {
                    queryParams.page++;
                    return recursivelyDownloadPagedEvents(queryParams, maximumPageRequests, eventsResponses);
                }
            });
        };

        this.getEvents = function(orgUnitId, periodRange, lastUpdated) {
            var startDate = moment(_.first(periodRange), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD'),
                endDate = moment(_.last(periodRange), 'GGGG[W]WW').endOf('isoWeek').format('YYYY-MM-DD'),
                maximumPageRequests = MAX_NUMBER_OF_EVENTS / EVENT_DATA_PAGE_SIZE;

            return recursivelyDownloadPagedEvents({
                startDate: startDate,
                endDate: endDate,
                orgUnit: orgUnitId,
                ouMode: "DESCENDANTS",
                fields: ":all,dataValues[value,dataElement,providedElsewhere,storedBy]",
                lastUpdated: lastUpdated,
                pageSize: EVENT_DATA_PAGE_SIZE
            }, maximumPageRequests);
        };

        this.getEventIds = function(orgUnitId, periodRange) {
            var startDate = moment(_.first(periodRange), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD'),
                endDate = moment(_.last(periodRange), 'GGGG[W]WW').endOf('isoWeek').format('YYYY-MM-DD'),
                maximumPageRequests = MAX_NUMBER_OF_EVENTS / EVENT_ID_PAGE_SIZE;

            return recursivelyDownloadPagedEvents({
                startDate: startDate,
                endDate: endDate,
                orgUnit: orgUnitId,
                ouMode: "DESCENDANTS",
                fields: "event",
                pageSize: EVENT_ID_PAGE_SIZE
            }, maximumPageRequests).then(function(events) {
                return _.pluck(events, 'event');
            });
        };

        this.upsertEvents = function(events) {
            var eventsToUpload = _.map(events, function(event) {
                return _.omit(event, ['period', 'localStatus', 'eventCode', 'clientLastUpdated']);
            });

            return $http.post(dhisUrl.events, { events: eventsToUpload });
        };

        this.deleteEvent = function(eventId) {
            var onSuccess = function(data) {
                return data;
            };
            var onError = function(data) {
                if (data.status !== 404) {
                    return $q.reject(data);
                } else {
                    return $q.when(data);
                }
            };
            return $http.delete(dhisUrl.events + "/" + eventId).then(onSuccess, onError);
        };
    };
});
