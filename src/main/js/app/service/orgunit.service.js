define(["dhisUrl", "lodash", "metadataConf", "pagingUtils", "properties", "constants"], function(dhisUrl, _, metadataConf, pagingUtils, properties, constants) {
    return function($http) {

        this.assignDataSetToOrgUnit = function(orgUnitId, dataSetId) {
            return $http.post(dhisUrl.orgUnits + '/' + orgUnitId + '/dataSets/' + dataSetId);
        };

        this.removeDataSetFromOrgUnit = function(orgUnitId, dataSetId) {
            return $http.delete(dhisUrl.orgUnits + '/' + orgUnitId + '/dataSets/' + dataSetId)
                .catch(function (response) {
                    if (response.errorCode !== constants.errorCodes.NOT_FOUND) {
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
                fields: metadataConf.fields.organisationUnits.params,
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
                fields: metadataConf.fields.organisationUnits.params,
                paging: metadataConf.fields.organisationUnits.paging,
                pageSize: metadataConf.fields.organisationUnits.pageSize
            };
            if (lastUpdatedTime) {
                params.filter = "lastUpdated:gte:" + lastUpdatedTime;
            }
            var downloadWithPagination = function () {
                return $http.get(url, {params: params}).then(function (response) {
                    return {
                        pager: response.data.pager,
                        data: response.data.organisationUnits
                    };
                });
            };

            return pagingUtils.paginateRequest(downloadWithPagination, params, properties.paging.maxPageRequests, []);
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
