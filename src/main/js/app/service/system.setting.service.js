define(["dhisUrl", "md5"], function(dhisUrl, md5) {
    return function($http) {
        this.excludeDataElements = function(data) {
            var postExcludedDataElements = function(systemSettingsToPost) {
                return $http({
                    method: 'POST',
                    url: dhisUrl.systemSettings + '/' + data.projectId,
                    data: JSON.stringify(systemSettingsToPost),
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                }).then(function() {
                    return data;
                });
            };

            return getExcludedDataElements(data.projectId).then(function(dataFromServer) {
                var computeNewSystemSettingsPayload = function() {
                    var moduleIds = _.keys(data.settings.excludedDataElements);
                    _.forEach(moduleIds, function(modId) {
                        var indexedDbChecksum = md5(JSON.stringify((data.indexedDbOldSystemSettings.excludedDataElements)[modId]));
                        var dhisChecksum = md5(JSON.stringify((dataFromServer.data.excludedDataElements[modId])));
                        if (dhisChecksum === indexedDbChecksum) {
                            (dataFromServer.data.excludedDataElements)[modId] = (data.settings.excludedDataElements)[modId];
                        } else {
                            console.error("Excluded data elements for " + modId + "under" + data.projectId + " have changed on server before this request could sync.");
                        }
                    });
                    return postExcludedDataElements(dataFromServer.data);
                };

                if (_.isEmpty(dataFromServer.data)) {
                    return postExcludedDataElements(data.settings);
                } else {
                    return computeNewSystemSettingsPayload();
                }
            });
        };

        var getExcludedDataElements = function(projectId) {
            return $http.get(dhisUrl.systemSettings + '/' + projectId);
        };
    };
});
