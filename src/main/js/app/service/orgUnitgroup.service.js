define(["properties", "lodash"], function(properties, _) {
    return function($http, db) {
        this.upsert = function(orgUnitGroupRequest) {
        	console.debug("Posting Orgunit Groups");
            return $http.post(properties.dhis.url + '/api/metadata', {
                'organisationUnitGroups': angular.isArray(orgUnitGroupRequest) ? orgUnitGroupRequest : [orgUnitGroupRequest]
            });
        };
    };
});