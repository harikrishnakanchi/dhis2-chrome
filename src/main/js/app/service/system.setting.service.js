define(["properties", "md5"], function(properties, md5) {
    return function($http) {
        this.excludeDataElements = function(data) {
            var postExcludedDataElements = function() {
                return $http({
                    method: 'POST',
                    url: properties.dhis.url + '/api/systemSettings/' + data.projectId,
                    data: JSON.stringify(data.settings),
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                }).then(function() {
                    return data;
                });
            };

            getExcludedDataElements(data.projectId).then(function(dataFromServer) {
                var dhisChecksum = md5(dataFromServer.data);
                if (dhisChecksum === data.checksum) {
                    return postExcludedDataElements();
                } else {
                    console.error("Excluded data elements for " + data.projectId + " have changed on server before this request could sync.");
                }
            });
        };

        var getExcludedDataElements = function(projectId) {
            return $http.get(properties.dhis.url + '/api/systemSettings/' + projectId);
        };
    };
});
