define(["properties", "httpUtils", "lodash"], function(properties, httpUtils, _) {
    return function($http, db) {
        this.upsert = function(orgUnitGroupRequest) {
            console.debug("Posting Orgunit Groups");
            return $http.post(properties.dhis.url + '/api/metadata', {
                'organisationUnitGroups': angular.isArray(orgUnitGroupRequest) ? orgUnitGroupRequest : [orgUnitGroupRequest]
            });
        };

        this.get = function(orgUnitGroupIds) {
            orgUnitGroupIds = _.isArray(orgUnitGroupIds) ? orgUnitGroupIds : [orgUnitGroupIds];
            return $http.get(properties.dhis.url + '/api/organisationUnitGroups.json?' + httpUtils.getParamString('id', orgUnitGroupIds));
        };

        this.getAll = function(lastUpdatedTime) {
            var url = properties.dhis.url + '/api/organisationUnitGroups.json?fields=:all&paging=false';
            url = lastUpdatedTime ? url + "&filter=lastUpdated:gte:" + lastUpdatedTime : url;
            return $http.get(url);
        };
    };
});
