define(["lodash", "moment", "dhisUrl"], function(_, moment, dhisUrl) {
    return function($http, $q) {
        this.downloadAllData = function(orgUnitIds, dataSetIds) {
            var today = moment().format("YYYY-MM-DD");
            var onSuccess = function(response) {
                if (_.isEmpty(response.data))
                    return [];
                return response.data.dataValues;
            };

            return $http.get(dhisUrl.dataValueSets, {
                "params": {
                    "orgUnit": orgUnitIds,
                    "children": true,
                    "dataSet": dataSetIds,
                    "startDate": "1900-01-01",
                    "endDate": today
                }
            }).then(onSuccess);
        };

        this.save = function(dataValues) {

            var sucessResponse = function(response) {
                if (response.data.status === "ERROR") {
                    return $q.reject(response);
                }
                return response;
            };

            var errorResponse = function(response) {
                return $q.reject(response);
            };

            var payload = {
                "dataValues": dataValues
            };
            return $http.post(dhisUrl.dataValueSets, payload).then(sucessResponse, errorResponse);
        };
    };
});
