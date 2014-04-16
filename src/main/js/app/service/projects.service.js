define(["properties"], function(properties) {
    return function($http) {
        var getPayload = function(orgUnit) {
            return {
                "organisationUnits": [orgUnit]
            };
        };

        var create = function(orgUnit) {
            return $http.post(properties.dhis.url + '/api/metadata', getPayload(orgUnit));
        };

        return {
            "create": create
        };
    };
});