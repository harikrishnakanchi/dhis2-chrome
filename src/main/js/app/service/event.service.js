define(["moment", "properties"], function(moment, properties) {
    return function($http) {

        this.getRecentEvents = function() {
        	var onSuccess = function(response) {
                return response.data;
            };

            return $http.get(properties.dhis.url + '/api/events', {
                "params": {
                    "startDate": moment().subtract(3,'months').format("YYYY-MM-DD"),
                    "endDate": moment().format("YYYY-MM-DD")
                }
            }).then(onSuccess);

        };
    };
});