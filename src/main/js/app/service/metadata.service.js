define(["dhisUrl", "moment", "properties"], function(dhisUrl, moment, properties) {
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
    };
});
