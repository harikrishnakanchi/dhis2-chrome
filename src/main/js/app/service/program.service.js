define(["properties", "lodash"], function(properties, _) {
    return function($http) {
        this.upload = function(programs) {
            return $http.post(properties.dhis.url + "/api/metadata", {
                "programs": programs
            });
        };
    };
});