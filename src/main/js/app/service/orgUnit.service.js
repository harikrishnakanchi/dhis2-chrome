define(["properties", "lodash"], function(properties, _) {
    return function($http, db) {
        this.get = function(orgUnitIds) {
            var generateParamsString = function(orgUnitIds) {
                var paramString = _.reduce(orgUnitIds, function(acc, id) {
                    acc = acc + "filter=id:eq:" + id + "&";
                    return acc;
                }, "?");

                paramString = paramString + "fields=:all&paging=false";
                return paramString;
            };

            orgUnitIds = _.isArray(orgUnitIds) ? orgUnitIds : [orgUnitIds];
            return $http.get(properties.dhis.url + '/api/organisationUnits.json' + generateParamsString(orgUnitIds));
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
