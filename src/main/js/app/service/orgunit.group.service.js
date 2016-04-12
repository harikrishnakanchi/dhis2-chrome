define(["dhisUrl", "httpUtils", "lodash"], function(dhisUrl, httpUtils, _) {
    return function($http) {

        this.get = function(orgUnitGroupIds) {
            orgUnitGroupIds = _.isArray(orgUnitGroupIds) ? orgUnitGroupIds : [orgUnitGroupIds];
            var url = dhisUrl.orgUnitGroups + '.json?' + httpUtils.getParamString('id', orgUnitGroupIds) + '&fields=:all';
            return $http.get(url).then(function(response) {
                return response.data.organisationUnitGroups;
            });
        };

        this.getAll = function(lastUpdatedTime) {
            var url = dhisUrl.orgUnitGroups + '.json?fields=:all&paging=false';
            url = lastUpdatedTime ? url + "&filter=lastUpdated:gte:" + lastUpdatedTime : url;
            return $http.get(url).then(function(response) {
                return response.data.organisationUnitGroups;
            });
        };

        this.addOrgUnit = function(orgUnitGroupId, orgUnitId) {
            return $http.post(dhisUrl.orgUnitGroups + "/" + orgUnitGroupId + "/organisationUnits/" + orgUnitId);
        };

        this.deleteOrgUnit = function(orgUnitGroupId, orgUnitId) {
            return $http.delete(dhisUrl.orgUnitGroups + "/" + orgUnitGroupId + "/organisationUnits/" + orgUnitId);
        };
    };
});
