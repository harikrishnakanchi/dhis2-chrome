define(["properties", "lodash"], function(properties, _) {
    return function($http) {
        this.upload = function(payload) {
            return $http.post(properties.dhis.url + "/api/programs", payload);
        };
    };
});