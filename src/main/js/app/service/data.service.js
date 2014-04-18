define(["lodash", "properties", "moment"], function(_, properties, moment) {
    return function($http, db) {

        var dataValueObjectStructure = {
            completeDate: '',
            dataValues: [],
            org_unit: '',
            period: ''
        };

        var fetchSuccess = function(response) {
            return response.data;
        };

        var fetchError = function(response) {
            return {
                "message": "Error fetching data from server."
            };
        };

        var saveToIndexedDB = function(payload) {
            var dataValuesStore = db.objectStore("dataValues");
            return dataValuesStore.upsert(payload);
        };

        this.save = function(payload) {
            return $http.post(properties.dhis.url + '/api/dataValueSets', payload);
        };

        this.fetch = function(orgUnit, dataSet) {
            var today = moment().format("YYYY-MM-DD");
            var urlParams = "orgUnit=" + orgUnit + "&dataSet=" + dataSet + "&startDate=1900-01-01&endDate=" + today;
            return $http.get(properties.dhis.url + '/api/dataValueSets?' + urlParams).then(fetchSuccess, fetchError);
        };

        this.parseAndSave = function(dataValueSets) {
            var periods = _.uniq(_.pluck(dataValueSets, 'period'));
            _.each(periods, function(period) {
                var values = _.filter(dataValueSets, {
                    'period': period
                });

                var dataValuesObject = JSON.parse(JSON.stringify(dataValueObjectStructure));
                dataValuesObject.period = period;
                dataValuesObject.dataValues = values;
                dataValuesObject.org_unit = values[0].orgUnit;

                saveToIndexedDB(dataValuesObject);
            });
        };
    };
});