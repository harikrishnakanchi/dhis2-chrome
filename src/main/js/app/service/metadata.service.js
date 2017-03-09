define(["dhisUrl", "moment", "properties", "metadataConf", "pagingUtils"], function(dhisUrl, moment, properties, metadataConf, pagingUtils) {
    return function($http) {

        var entityPagingParams = {
            indicators: {
                paging: true,
                pageSize: 100
            },
            categoryOptionCombos: {
                paging: true,
                pageSize: 200
            },
            categoryOptions: {
                paging: true,
                pageSize: 200
            },
            dataElements: {
                paging: true,
                pageSize: 100
            },
            programIndicators: {
                paging: true,
                pageSize: 100
            },
            sections: {
                paging: true,
                pageSize: 150
            },
            users: {
                paging: true,
                pageSize: 25
            },
            translations: {
                paging: true,
                pageSize: 300
            }
        };

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
            var params = {fields: metadataConf.fields[type], paging: false};
            if (lastUpdated) {
                params.filter = 'lastUpdated:ge:' + lastUpdated;
            }
            params = _.merge(params, entityPagingParams[type]);
            return params.paging ? pagingUtils.paginateRequest(_.partial(downloadWithPagination, url, type), params, properties.paging.maxPageRequests, []) :
                downloadWithoutPagination(url, params, type);
        };
    };
});
