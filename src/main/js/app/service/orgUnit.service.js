define(["properties", "lodash"], function(properties, _) {
    return function($http, db) {

        var create = function(orgUnitRequest) {
            return $http.post(properties.dhis.url + '/api/metadata', {
                'organisationUnits': angular.isArray(orgUnitRequest) ? orgUnitRequest : [orgUnitRequest]
            });
        };

        return {
            "create": create
        };
    };
});