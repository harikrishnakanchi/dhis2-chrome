define(["properties"], function(properties) {
    return function($http) {


        var create = function(payload) {
            payload = {
                'organisationUnits': payload
            };
            return $http.post(properties.dhis.url + '/api/metadata', payload);
        };

        return {
            "create": create
        };
    };
});