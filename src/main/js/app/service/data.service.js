define(["lodash", "properties", "moment"], function(_, properties, moment) {
    return function($http, db, $q) {
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

        this.get = function(orgUnit) {
            var today = moment().format("YYYY-MM-DD");
            var onSuccess = function(response) {
                return response.data;
            };

            var onError = function(response) {
                return {
                    "message": "Error fetching data from server."
                };
            };

            var getAllDatasets = function() {
                var store = db.objectStore("dataSets");
                return store.getAll();
            };

            var getDataForDatasets = function(dataSets) {
                return $http.get(properties.dhis.url + '/api/dataValueSets', {
                    "params": {
                        "orgUnit": orgUnit,
                        "dataSet": _.map(dataSets, "id"),
                        "startDate": "1900-01-01",
                        "endDate": today
                    }
                }).then(onSuccess, onError);
            };

            return getAllDatasets().then(getDataForDatasets);
        };

        this.saveToDb = function(dataValueSets, orgUnit) {
            var groupedDataValues = _.groupBy(dataValueSets, 'period');
            var dataValueSetsAggregator = function(result, dataValues, period) {
                result.push({
                    "period": period,
                    "dataValues": dataValues,
                    "orgUnit": orgUnit
                });
            };
            var dataValues = _.transform(groupedDataValues, dataValueSetsAggregator, []);
            var dataValuesStore = db.objectStore("dataValues");
            return dataValuesStore.upsert(dataValues);
        };
    };
});