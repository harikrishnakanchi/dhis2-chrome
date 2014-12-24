define(["properties", "lodash"], function(properties, _) {
    return function($http, db) {
        this.get = function(orgUnitId) {
            return $http.get(properties.dhis.url + '/api/organisationUnits/' + orgUnitId + ".json?fields=:all");
        };

        this.upsert = function(orgUnitRequest) {
            return $http.post(properties.dhis.url + '/api/metadata', {
                'organisationUnits': angular.isArray(orgUnitRequest) ? orgUnitRequest : [orgUnitRequest]
            });
        };
    };
});
