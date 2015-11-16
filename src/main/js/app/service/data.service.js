define(["lodash", "moment", "dhisUrl", "properties"], function(_, moment, dhisUrl, properties) {
    return function($http, $q) {
        this.downloadData = function(orgUnitIds, dataSetIds, periods, lastUpdated) {
            var config = {
                "params": {
                    "orgUnit": orgUnitIds,
                    "children": true,
                    "dataSet": dataSetIds,
                    "period": periods,
                    "lastUpdated": lastUpdated
                }
            };

            return $http.get(dhisUrl.dataValueSets, config).then(function(response) {

                if (_.isEmpty(response.data))
                    return [];

                return _.map(response.data.dataValues, function(dataValue) {
                    dataValue.period = moment(dataValue.period, "GGGG[W]W").format("GGGG[W]WW");
                    return dataValue;
                });
            });
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
