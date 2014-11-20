define(["moment", "properties"], function(moment, properties) {
    return function($http) {

        this.getRecentEvents = function(startDate) {
        	var onSuccess = function(response) {
                return response.data;
            };

            return $http.get(properties.dhis.url + '/api/events', {
                "params": {
                    "startDate": startDate,
                    "endDate": moment().format("YYYY-MM-DD")
                }
            }).then(onSuccess);

        };
    };
});