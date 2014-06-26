define(["properties"], function(properties) {
    return function($http) {
        var associateDataSetsToOrgUnit = function(payload) {
            payload = {
                'dataSets': payload
            };

            var saveToDhis = function(data) {
                return $http.post(properties.dhis.url + '/api/metadata', payload).then(function() {
                    return data;
                });
            };

            return saveToDhis(payload);
        };

        return {
            "associateDataSetsToOrgUnit": associateDataSetsToOrgUnit
        };
    };
});