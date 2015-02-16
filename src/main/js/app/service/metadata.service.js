define(["dhisUrl", "moment"], function(dhisUrl, moment) {
    return function($http) {
        this.getMetadata = function(lastUpdatedTime) {
            var url = dhisUrl.metadata + (lastUpdatedTime ? "?lastUpdated=" + lastUpdatedTime : "");
            return $http.get(url).then(function(response) {
                return response.data;
            });
        };

        this.loadMetadataFromFile = function(lastUpdatedTime) {
            return $http.get("/data/metadata.json").then(function(response) {
                var metaData = response.data;
                if (lastUpdatedTime && moment(lastUpdatedTime).isAfter(metaData.created))
                    return;
                return metaData;
            });
        };
    };
});
