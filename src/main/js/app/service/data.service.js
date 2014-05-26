define(["lodash", "properties", "moment"], function(_, properties, moment) {
    return function($http, $q) {
        this.downloadAllData = function(orgUnits, dataSets) {
            var today = moment().format("YYYY-MM-DD");
            var onSuccess = function(response) {
                return response.data;
            };

            var onError = function(response) {
                var deferred = $q.defer();
                deferred.reject({
                    "message": "Error fetching data from server."
                });
                return deferred.promise;
            };

            return $http.get(properties.dhis.url + '/api/dataValueSets', {
                "params": {
                    "orgUnit": orgUnits,
                    "children": true,
                    "dataSet": _.map(dataSets, "id"),
                    "startDate": "1900-01-01",
                    "endDate": today
                }
            }).then(onSuccess, onError);
        };

        this.save = function(payload) {
            var sucessResponse = function(response) {
                if (response.data.status === "ERROR") {
                    return $q.reject(response);
                }
                return response;
            };

            var errorResponse = function(response) {
                return $q.reject(response);
            };

            return $http.post(properties.dhis.url + '/api/dataValueSets', payload).then(sucessResponse, errorResponse);
        };
    };
});