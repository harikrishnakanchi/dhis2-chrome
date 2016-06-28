define(["moment", "dhisUrl"], function(moment, dhisUrl) {
    return function($http, $q) {

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
