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
                var metaData = response.data;
                if (lastUpdatedTime && moment(lastUpdatedTime).isAfter(metaData.created))
                    return;
                return metaData;
            });
        };
    };
});
