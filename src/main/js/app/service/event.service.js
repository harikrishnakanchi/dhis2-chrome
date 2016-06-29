define(["dhisUrl", "moment", "lodash"], function(dhisUrl, moment, _) {
    return function($http, $q) {
        var EVENT_ID_PAGE_SIZE = 1000,
            EVENT_ID_PAGE_REQUESTS_MAX_LIMIT = 20,
            DEFAULT_PAGE_REQUESTS_MAX_LIMIT = 99;

        var recursivelyDownloadPagedEvents = function(queryParams, pageRequestsMaxLimit, eventsResponses) {
            queryParams.totalPages = true;
            queryParams.page = queryParams.page || 1;
            eventsResponses = eventsResponses || [];
            pageRequestsMaxLimit = pageRequestsMaxLimit || DEFAULT_PAGE_REQUESTS_MAX_LIMIT;

            return $http.get(dhisUrl.events, { params: queryParams }).then(function(response) {
                var eventsResponse = response.data.events || [],
                    totalPages = response.data.pageCount || 0,
                    lastPageReached = queryParams.page >= totalPages,
                    pageLimitReached = queryParams.page >= pageRequestsMaxLimit;

                eventsResponses.push(eventsResponse);

                if(lastPageReached || pageLimitReached || _.isEmpty(eventsResponse)) {
                    return $q.when(_.flatten(eventsResponses));
                } else {
                    queryParams.page++;
                    return recursivelyDownloadPagedEvents(queryParams, pageRequestsMaxLimit, eventsResponses);
                }
            });
        };

        this.getEvents = function(orgUnitId, periodRange) {
            var startDate = moment(_.first(periodRange), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD'),
                endDate = moment(_.last(periodRange), 'GGGG[W]WW').endOf('isoWeek').format('YYYY-MM-DD');

            return $http.get(dhisUrl.events, {
                "params": {
                    "startDate": startDate,
                    "endDate": endDate,
                    "skipPaging": true,
                    "orgUnit": orgUnitId,
                    "ouMode": "DESCENDANTS",
                    "fields": ":all,dataValues[value,dataElement,providedElsewhere,storedBy]"
                }
            }).then(function(response) {
                return response.data.events || [];
            });
        };

        this.getEventIds = function(orgUnitId, periodRange) {
            var startDate = moment(_.first(periodRange), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD'),
                endDate = moment(_.last(periodRange), 'GGGG[W]WW').endOf('isoWeek').format('YYYY-MM-DD');

            return recursivelyDownloadPagedEvents({
                startDate: startDate,
                endDate: endDate,
                orgUnit: orgUnitId,
                ouMode: "DESCENDANTS",
                fields: "event",
                pageSize: EVENT_ID_PAGE_SIZE
            }, EVENT_ID_PAGE_REQUESTS_MAX_LIMIT).then(function(events) {
                return _.pluck(events, 'event');
            });
        };

        this.upsertEvents = function(eventsPayload) {
            var updatedEventsPayload = function() {
                return _.map(eventsPayload.events, function(eventPayload) {
                    return _.omit(eventPayload, ['period', 'localStatus', 'eventCode', 'clientLastUpdated']);
                });
            };

            var updatedPayload = {
                "events": updatedEventsPayload()
            };

            var onSuccess = function(data) {
                return eventsPayload;
            };

            var onFailure = function(data) {
                return $q.reject(data);
            };

            return $http.post(dhisUrl.events, updatedPayload).then(onSuccess, onFailure);
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
