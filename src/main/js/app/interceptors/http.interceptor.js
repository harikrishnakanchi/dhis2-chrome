define(["properties"], function(properties) {
    return function($rootScope, $q) {
        var finishRequest = function(response) {
            if (response.config.url.indexOf('templates/') !== 0) {
                $rootScope.pendingRequests -= 1;
                if ($rootScope.pendingRequests === 0) {
                    $rootScope.loading = false;
                }
            }
        };

        $rootScope.pendingRequests = 0;
        return {
            'request': function(config) {
                if (config.url.indexOf('templates/') !== 0) {
                    $rootScope.loading = true;
                    $rootScope.pendingRequests += 1;
                }
                if (config.url.indexOf(properties.dhis.url) === 0) {
                    config.headers.Authorization = properties.dhis.auth_header;
                }
                return config;
            },
            'response': function(response) {
                finishRequest(response);
                return response;
            },
            'responseError': function(rejection) {
                finishRequest(rejection);
                return $q.reject(rejection);
            }
        };
    };
});