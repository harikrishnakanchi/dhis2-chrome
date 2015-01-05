define(["dhisUrl", "httpUtils", "lodash"], function(dhisUrl, httpUtils, _) {
    return function($http, db) {
        this.upsert = function(orgUnitGroupRequest) {
            console.debug("Posting Orgunit Groups");
            return $http.post(dhisUrl.metadata, {
                'organisationUnitGroups': angular.isArray(orgUnitGroupRequest) ? orgUnitGroupRequest : [orgUnitGroupRequest]
            });
        };

        this.get = function(orgUnitGroupIds) {
            orgUnitGroupIds = _.isArray(orgUnitGroupIds) ? orgUnitGroupIds : [orgUnitGroupIds];
            return $http.get(dhisUrl.orgUnitGroups + '?' + httpUtils.getParamString('id', orgUnitGroupIds));
        };

        this.getAll = function(lastUpdatedTime) {
            var url = dhisUrl.orgUnitGroups + '?fields=:all&paging=false';
            url = lastUpdatedTime ? url + "&filter=lastUpdated:gte:" + lastUpdatedTime : url;
            return $http.get(url);
        };
    };
});
