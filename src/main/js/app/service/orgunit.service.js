define(["dhisUrl", "httpUtils", "lodash", "metadataConf"], function(dhisUrl, httpUtils, _, metadataConf) {
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

        this.get = function (orgUnitIds) {
            orgUnitIds = _.isArray(orgUnitIds) ? orgUnitIds : [orgUnitIds];
            var url = dhisUrl.orgUnits + '.json';
            var params = {
                filter: _.map(orgUnitIds, function (orgUnitId) {
                    return 'id:eq:' + orgUnitId;
                }),
                fields: metadataConf.fields.organisationUnits,
                paging: false
            };
            return $http.get(url, {params: params}).then(function (response) {
                return response.data.organisationUnits;
            });
        };

        this.upsert = function(orgUnitRequest) {
            return $http.post(dhisUrl.metadata, {
                'organisationUnits': angular.isArray(orgUnitRequest) ? orgUnitRequest : [orgUnitRequest]
            });
        };

        this.getAll = function (lastUpdatedTime) {
            var url = dhisUrl.orgUnits + '.json';

            var params = {
                fields: metadataConf.fields.organisationUnits,
                paging: false
            };
            if (lastUpdatedTime) {
                params.filter = "lastUpdated:gte:" + lastUpdatedTime;
            }
            return $http.get(url, {params: params}).then(function (response) {
                return response.data.organisationUnits;
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
            }).catch(function () {
                return [];
            });
        };
    };
});
