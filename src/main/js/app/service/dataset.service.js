define(["dhisUrl"], function(dhisUrl) {
    return function($http) {
        var associateDataSetsToOrgUnit = function(payload) {
            payload = {
                'dataSets': payload
            };

            var saveToDhis = function(data) {
                return $http.post(dhisUrl.metadata, payload).then(function() {
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
