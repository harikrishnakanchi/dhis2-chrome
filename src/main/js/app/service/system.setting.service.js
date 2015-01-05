define(["dhisUrl", "md5"], function(dhisUrl, md5) {
    return function($http) {
        this.excludeDataElements = function(data) {
            var postExcludedDataElements = function() {
                return $http({
                    method: 'POST',
                    url: dhisUrl.systemSettings + '/' + data.projectId,
                    data: JSON.stringify(data.settings),
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                }).then(function() {
                    return data;
                });
            };

            getExcludedDataElements(data.projectId).then(function(dataFromServer) {
                var dhisChecksum = md5(JSON.stringify(dataFromServer.data));
                if (dhisChecksum === data.checksum) {
                    return postExcludedDataElements();
                } else {
                    console.error("Excluded data elements for " + data.projectId + " have changed on server before this request could sync.");
                }
            });
        };

        var getExcludedDataElements = function(projectId) {
            return $http.get(dhisUrl.systemSettings + '/' + projectId);
        };
    };
});
