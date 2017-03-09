define(["dhisUrl", "lodash", "metadataConf", "pagingUtils", "properties"], function(dhisUrl, _, metadataConf, pagingUtils, properties) {
    return function($http, $q) {

        this.get = function (orgUnitGroupIds) {
            orgUnitGroupIds = _.isArray(orgUnitGroupIds) ? orgUnitGroupIds : [orgUnitGroupIds];
            var url = dhisUrl.orgUnitGroups + '.json';
            var params = {
                filter: _.map(orgUnitGroupIds, function (orgUnitGroupId) {
                    return 'id:eq:' + orgUnitGroupId;
                }),
                fields: metadataConf.fields.organisationUnitGroups.params,
                paging: false
            };
            return $http.get(url, {params: params}).then(function (response) {
                return response.data.organisationUnitGroups;
            });
        };

        this.getAll = function (lastUpdatedTime) {
            var url = dhisUrl.orgUnitGroups + '.json';
            var params = {
                fields: metadataConf.fields.organisationUnitGroups.params,
                paging: true
            };

            if (lastUpdatedTime) {
                params.filter = "lastUpdated:gte:" + lastUpdatedTime;
            }
            var downloadWithPagination = function (params) {
                return $http.get(url, {params: params}).then(function (response) {
                    return {
                        pager: response.data.pager,
                        data: response.data.organisationUnitGroups
                    };
                });
            };

            return pagingUtils.paginateRequest(downloadWithPagination, params, properties.paging.maxPageRequests, []);
        };

        this.addOrgUnit = function(orgUnitGroupId, orgUnitId) {
            return $http.post(dhisUrl.orgUnitGroups + "/" + orgUnitGroupId + "/organisationUnits/" + orgUnitId);
        };

        this.deleteOrgUnit = function (orgUnitGroupId, orgUnitId) {
            return $http.delete(dhisUrl.orgUnitGroups + "/" + orgUnitGroupId + "/organisationUnits/" + orgUnitId)
                .catch(function (response) {
                    if (response.status === 404) {
                        return $q.when();
                    } else {
                        return $q.reject(response);
                    }
                });
        };
    };
});
