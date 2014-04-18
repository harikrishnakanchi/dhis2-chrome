define(["lodash", "properties", "moment"], function(_, properties, moment) {
    return function($http, db) {
        this.save = function(payload) {
            return $http.post(properties.dhis.url + '/api/dataValueSets', payload);
        };

        this.get = function(orgUnit, dataSets) {
            var today = moment().format("YYYY-MM-DD");
            var onSuccess = function(response) {
                return response.data;
            };

            var onError = function(response) {
                return {
                    "message": "Error fetching data from server."
                };
            };

            return $http.get(properties.dhis.url + '/api/dataValueSets', {
                "params": {
                    "orgUnit": orgUnit,
                    "dataSet": dataSets,
                    "startDate": "1900-01-01",
                    "endDate": today
                }
            }).then(onSuccess, onError);
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