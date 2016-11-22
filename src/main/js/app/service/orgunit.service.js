define(["dhisUrl", "httpUtils", "lodash"], function(dhisUrl, httpUtils, _) {
    return function($http) {

        this.assignDataSetToOrgUnit = function(orgUnitId, dataSetId) {
            return $http.post(dhisUrl.orgUnits + '/' + orgUnitId + '/dataSets/' + dataSetId);
        };

        this.removeDataSetFromOrgUnit = function(orgUnitId, dataSetId) {
            return $http.delete(dhisUrl.orgUnits + '/' + orgUnitId + '/dataSets/' + dataSetId)
                .catch(function (response) {
                    if (response.status != 404) {
                        return $q.reject();
                    }
                });
        };

        this.get = function(orgUnitIds) {
            orgUnitIds = _.isArray(orgUnitIds) ? orgUnitIds : [orgUnitIds];
            var url = dhisUrl.orgUnits + '.json?' + httpUtils.getParamString('id', orgUnitIds) + '&fields=:all,parent[:identifiable],attributeValues[:identifiable,value,attribute[:identifiable]],dataSets,!access,!href,!uuid';
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
            var url = dhisUrl.orgUnits + '.json?paging=false&fields=:all,parent[:identifiable],attributeValues[:identifiable,value,attribute[:identifiable]],dataSets,!access,!href,!uuid';
            url = lastUpdatedTime ? url + "&filter=lastUpdated:gte:" + lastUpdatedTime : url;
            return $http.get(url).then(function(response) {
                return response.data.organisationUnits;
            });
        };

        this.getIds = function(orgUnitIds) {
            var url = dhisUrl.orgUnits + '.json?' + httpUtils.getParamString('id', orgUnitIds) + "&fields=id";
            return $http.get(url).then(function(response) {
                return _.pluck(response.data.organisationUnits, "id");
            });
        };

        this.create = function (orgUnit) {
            return $http.post(dhisUrl.orgUnits, orgUnit);
        };

        this.update = function (orgUnitToBeUpdated) {
            return $http.put(dhisUrl.orgUnits + '/' + orgUnitToBeUpdated.id, orgUnitToBeUpdated);
        };

        this.loadFromFile = function () {
            return $http.get('data/organisationUnits.json').then(function (response) {
              return response.data.organisationUnits;
            });
        };
    };
});
