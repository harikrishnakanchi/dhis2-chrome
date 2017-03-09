define(["dhisUrl", "lodash", "metadataConf", "pagingUtils", "properties"], function(dhisUrl, _, metadataConf, pagingUtils, properties) {
    return function($http) {
        this.upsert = function(programs) {
            return $http.post(dhisUrl.metadata, {
                "programs": programs
            });
        };

        this.assignOrgUnitToProgram = function (programId, orgUnitId) {
            return $http.post(dhisUrl.programs + '/' + programId + '/organisationUnits/' + orgUnitId);
        };

        this.getAll = function (lastUpdatedTime) {
            var url = dhisUrl.programs + ".json";
            var params = {
                fields: metadataConf.fields.programs.params,
                paging: metadataConf.fields.programs.paging
            };
            if (lastUpdatedTime)
                params.filter = "lastUpdated:gte:" + lastUpdatedTime;

            var downloadWithPagination = function (params) {
                return $http.get(url, {params: params}).then(function (response) {
                    return {
                        pager: response.data.pager,
                        data: response.data.programs
                    };
                });
            };

            return pagingUtils.paginateRequest(downloadWithPagination, params, properties.paging.maxPageRequests, []);
        };

        this.loadFromFile = function() {
            return $http.get("data/programs.json").then(function(response) {
                return response.data.programs;
            }).catch(function () {
                return [];
            });
        };

    };
});
