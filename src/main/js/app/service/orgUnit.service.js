define(["properties", "httpUtils", "lodash"], function(properties, httpUtils, _) {
    return function($http, db) {
        this.get = function(orgUnitIds) {
            orgUnitIds = _.isArray(orgUnitIds) ? orgUnitIds : [orgUnitIds];
            return $http.get(properties.dhis.url + '/api/organisationUnits.json?' + httpUtils.getParamString('id', orgUnitIds));
        };

        this.upsert = function(orgUnitRequest) {
            return $http.post(properties.dhis.url + '/api/metadata', {
                'organisationUnits': angular.isArray(orgUnitRequest) ? orgUnitRequest : [orgUnitRequest]
            });
        };

        this.getAll = function(lastUpdatedTime) {
            var url = properties.dhis.url + '/api/organisationUnits.json?fields=:all';
            url = lastUpdatedTime ? url + "&filter=lastUpdated:gte:" + lastUpdatedTime : url;
            return $http.get(url);
        };
    };
});
