define(["dhisUrl", "httpUtils", "lodash", "metadataConf"], function(dhisUrl, httpUtils, _, metadataConf) {
    return function($http, $q) {

        this.get = function(orgUnitGroupIds) {
            orgUnitGroupIds = _.isArray(orgUnitGroupIds) ? orgUnitGroupIds : [orgUnitGroupIds];
            var url = dhisUrl.orgUnitGroups + '.json?' + httpUtils.getParamString('id', orgUnitGroupIds) + '&fields=' + metadataConf.fields.organisationUnitGroups;
            return $http.get(url).then(function(response) {
                return response.data.organisationUnitGroups;
            });
        };

        this.getAll = function (lastUpdatedTime) {
            var url = dhisUrl.orgUnitGroups + '.json';
            var params = {
                fields: metadataConf.fields.organisationUnitGroups,
                paging: false
            };

            if (lastUpdatedTime) {
                params.filter = "lastUpdated:gte:" + lastUpdatedTime;
            }
            return $http.get(url, {params: params}).then(function (response) {
                return response.data.organisationUnitGroups;
            });
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
