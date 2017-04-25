define(["dhisUrl", "metadataConf", "pagingUtils", "properties", "constants"], function(dhisUrl, metadataConf, pagingUtils, properties, constants) {
    return function($http, $q) {

        this.getAll = function (lastUpdatedTime) {
            var url = dhisUrl.dataSets + ".json";
            var params = {
                fields: metadataConf.fields.dataSets.params,
                paging: metadataConf.fields.dataSets.paging
            };
            if (lastUpdatedTime)
                params.filter = "lastUpdated:gte:" + lastUpdatedTime;

            var downloadWithPagination = function (params) {
                return $http.get(url, {params: params}).then(function (response) {
                    return {
                        pager: response.data.pager,
                        data: response.data.dataSets
                    };
                });
            };

            return pagingUtils.paginateRequest(downloadWithPagination, params, properties.paging.maxPageRequests, []);
        };

        this.loadFromFile = function() {
            return $http.get("data/dataSets.json").then(function(response) {
                return response.data.dataSets;
            }).catch(function () {
                return [];
            });
        };

    };
});
