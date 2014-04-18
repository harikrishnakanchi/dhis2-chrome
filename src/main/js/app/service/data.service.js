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

        this.parseAndSave = function(dataValueSets) {
            var periods = _.uniq(_.pluck(dataValueSets, 'period'));
            _.each(periods, function(period) {
                var values = _.filter(dataValueSets, {
                    'period': period
                });

                var dataValues = {
                    period: period,
                    dataValues: values,
                    orgUnit: values[0].orgUnit
                };

                var dataValuesStore = db.objectStore("dataValues");
                return dataValuesStore.upsert(dataValues);
            });
        };
    };
});