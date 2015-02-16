define(["dhisUrl", "httpUtils", "lodash"], function(dhisUrl, httpUtils, _) {
    return function($http, db) {
        this.get = function(orgUnitIds) {
            orgUnitIds = _.isArray(orgUnitIds) ? orgUnitIds : [orgUnitIds];
            var url = dhisUrl.orgUnits + '?' + httpUtils.getParamString('id', orgUnitIds) + ',!dataSets,!access,!href,!uuid';
            return $http.get(url).then(function(response) {
                return response.data.organisationUnits;
            });
        };

        this.upsert = function(orgUnitRequest) {
            return $http.post(dhisUrl.metadata, {
                'organisationUnits': angular.isArray(orgUnitRequest) ? orgUnitRequest : [orgUnitRequest]
            });
        };

        this.getAll = function(lastUpdatedTime) {
            var url = dhisUrl.orgUnits + '?paging=false&fields=:all,!dataSets,!access,!href,!uuid';
            url = lastUpdatedTime ? url + "&filter=lastUpdated:gte:" + lastUpdatedTime : url;
            return $http.get(url).then(function(response) {
                return response.data.organisationUnits;
            });
        };
    };
});
