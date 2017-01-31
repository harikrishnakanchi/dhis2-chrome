define(["dhisUrl", "moment", "properties", "metadataConf"], function(dhisUrl, moment, properties, metadataConf) {
    return function($http) {
        this.getMetadata = function(lastUpdatedTime) {
            var config = {
                params : {
                    assumeTrue: false,
                    lastUpdated: lastUpdatedTime || null
                }
            };

            _.each(properties.metadata.types, function(type){
               config.params[type] = true;
            });

            return $http.get(dhisUrl.filteredMetadata, config).then(function(response) {
                return response.data;
            });
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

        this.getMetadataOfType = function (type, lastUpdated) {
            var url = dhisUrl[type];
            var params = {fields: metadataConf.types[type]};
            if (lastUpdated) {
                params.filter = 'lastUpdated:ge:' + lastUpdated;
            }
            return $http.get(url, {params: params}).then(function (response) {
                return response.data;
            });
        };
    };
});
