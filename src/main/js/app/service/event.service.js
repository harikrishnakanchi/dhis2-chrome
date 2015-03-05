define(["moment", "dhisUrl"], function(moment, dhisUrl) {
    return function($http, $q) {

        this.getRecentEvents = function(startDate) {
            var onSuccess = function(response) {
                return response.data;
            };

            return $http.get(dhisUrl.events, {
                "params": {
                    "startDate": startDate,
                    "endDate": moment().format("YYYY-MM-DD"),
                    "paging": false
                }
            }).then(onSuccess);

        };

        this.upsertEvents = function(eventsPayload) {
            var updatedEventsPayload = function() {
                return _.map(eventsPayload.events, function(eventPayload) {
                    return _.omit(eventPayload, ['period', 'localStatus']);
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
