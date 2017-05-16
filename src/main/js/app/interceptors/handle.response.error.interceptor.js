define(["properties", "platformUtils", "constants"], function(properties, platformUtils, constants) {
    return function($q, $injector, $timeout) {
        var errorCodes = constants.errorCodes;
        var errorCodeMappings = {
            401: errorCodes.UNAUTHORISED,
            404: errorCodes.NOT_FOUND
        };

        return {
            'responseError': function(response) {
                var dhisMonitor = $injector.get('dhisMonitor');
                if (dhisMonitor.isOnline() && response.config.method === "GET" && (response.status === 0 || response.status === 504)) {
                    platformUtils.sendMessage("timeoutOccurred");
                    var $http = $injector.get('$http');
                    response.config.params = response.config.params || {};
                    response.config.params.retry = response.config.params.retry || 0;
                    response.config.params.retry++;
                    return $timeout(function() {
                        return $http(response.config);
                    }, properties.queue.httpGetRetryDelay);
                } else {
                    response.errorCode = dhisMonitor.isOnline() ? errorCodeMappings[response.status] : errorCodes.NETWORK_UNAVAILABLE;
                    return $q.reject(response);
                }
            }
        };
    };
});
