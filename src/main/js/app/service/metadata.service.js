define(["dhisUrl", "moment", "properties", "metadataConf", "pagingUtils"], function(dhisUrl, moment, properties, metadataConf, pagingUtils) {
    return function($http) {

        this.loadMetadataFromFile = function(lastUpdatedTime) {
            return $http.get("data/metadata.json").then(function(response) {
                return response.data;
            }).catch(function () {
                return {
                    created: '2014-03-23T09:02:49.870+0000',
                    dataSets: [],
                    organisationUnitGroups: [],
                    organisationUnits: [],
                    programs: []
                };
            });
        };

        var downloadWithoutPagination = function (url, params, type) {
            return $http.get(url, {params: params}).then(function (response) {
                return response.data[type];
            });
        };

        var downloadWithPagination = function (url, type, params) {
            return $http.get(url, { params: params }).then(function(response) {
                return {
                    pager: response.data.pager,
                    data: response.data[type]
                };
            });
        };

        this.getMetadataOfType = function (type, lastUpdated) {
            var url = dhisUrl[type];
            var params = {fields: metadataConf.fields[type].params, paging: metadataConf.fields[type].paging};
            if (lastUpdated) {
                params.filter = 'lastUpdated:ge:' + lastUpdated;
            }
            var pageSize = metadataConf.fields[type].pageSize;
            if(pageSize) {
                params.pageSize = pageSize;
            }
            return params.paging ? pagingUtils.paginateRequest(_.partial(downloadWithPagination, url, type), params, properties.paging.maxPageRequests, []) :
                downloadWithoutPagination(url, params, type);
        };
    };
});
