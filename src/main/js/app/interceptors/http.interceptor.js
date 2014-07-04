define(["properties", "chromeRuntime"], function(properties, chromeRuntime) {
    return function($rootScope, $q) {
        $rootScope.pendingRequests = 0;
        return {
            'request': function(config) {
                config.timeout = properties.http.timeout;
                if (config.url.indexOf(properties.dhis.url) === 0) {
                    config.headers.Authorization = properties.dhis.auth_header;
                }
                return config;
            },
            'response': function(response) {
                return response;
            },
            'responseError': function(rejection) {
                if (rejection.status === 0 && rejection.config.url.indexOf(properties.dhisPing.url) !== 0) {
                    chromeRuntime.sendMessage("checkNow");
                }
                return $q.reject(rejection);
            }
        };
    };
});