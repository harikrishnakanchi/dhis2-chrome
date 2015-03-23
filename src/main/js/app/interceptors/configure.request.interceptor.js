define(["properties"], function(properties) {
    return function($q) {
        var checkAndProceed = function(config) {
            var deferred = $q.defer();
            if (config.url.indexOf(properties.dhis.url) === 0) {
                chrome.storage.local.get("auth_header", function(result) {
                    deferred.resolve(result.auth_header);
                });
                return deferred.promise;
            }
        };
        return {
            'request': function(config) {
                config.timeout = properties.http.timeout;
                return checkAndProceed(config).then(function(data) {
                    config.headers.Authorization = data;
                    return config;
                });
            }
        };
    };
});