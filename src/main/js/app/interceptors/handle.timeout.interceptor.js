define(["properties", "chromeUtils"], function(properties, chromeUtils) {
    return function($q, $injector, $timeout) {
        return {
            'responseError': function(response) {
                var dhisMonitor = $injector.get('dhisMonitor');
                if (dhisMonitor.isOnline() && response.config.method === "GET" && (response.status === 0 || response.status === 504)) {
                    chromeUtils.sendMessage("timeoutOccurred");
                    var $http = $injector.get('$http');
                    response.config.params = response.config.params || {};
                    response.config.params.retry = response.config.params.retry || 0;
                    response.config.params.retry++;
                    return $timeout(function() {
                        return $http(response.config);
                    }, properties.queue.httpGetRetryDelay);
                } else {
                    return $q.reject(response);
                }
            }
        };
    };
});
