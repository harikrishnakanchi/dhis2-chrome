define(["properties", "chromeUtils"], function(properties, chromeUtils) {
    return function($q, $injector) {
        return {
            'responseError': function(response) {
                if (response.config.method === "GET" && (response.status === 0 || response.status === 504)) {
                    chromeUtils.sendMessage("timeoutOccurred");
                    var $http = $injector.get('$http');
                    response.config.params = response.config.params || {};
                    response.config.params.retry = response.config.params.retry || 0;
                    response.config.params.retry++;
                    return $http(response.config);
                } else {
                    return $q.reject(response);
                }
            }
        };
    };
});
