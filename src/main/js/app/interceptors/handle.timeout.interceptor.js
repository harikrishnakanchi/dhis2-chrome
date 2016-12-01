define(["properties", "platformUtils"], function(properties, platformUtils) {
    return function($q, $injector, $timeout) {
        return {
            'responseError': function(response) {
                var dhisMonitor = $injector.get('dhisMonitor');
                if(!dhisMonitor.isOnline() && dhisMonitor.maxTriesReachedForNoNetwork()) {
                    return $q.reject(response);
                }

                if (response.config.method === "GET" && (response.status === 0 || response.status === 504) &&
                    (!response.config.params || !response.config.params.retry || response.config.params.retry < properties.queue.maxretries)) {
                    platformUtils.sendMessage("timeoutOccurred");
                    var $http = $injector.get('$http');
                    response.config.params = response.config.params || {};
                    response.config.params.retry = response.config.params.retry || 0;
                    response.config.params.retry++;
                    if(!dhisMonitor.isOnline() && response.config.params.retry == properties.queue.maxretries)
                        dhisMonitor.setMaxTriesIfNoNetwork();
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
