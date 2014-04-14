define(["lodash", "properties"], function(_, properties) {
    return function($http) {
        this.save = function(payload) {
            return $http.post(properties.dhis.url + '/api/dataValueSets', payload);
        };
    };
});