define(["properties"], function(properties) {
    return function($rootScope, $q) {
        $rootScope.pendingRequests = 0;
        return {
            'request': function(config) {
                $rootScope.loading = true;
                $rootScope.pendingRequests += 1;
                if (config.url.indexOf(properties.dhis.url) === 0) {
                    config.headers.Authorization = properties.dhis.auth_header;
                }
                return config;
            },
            'response': function(response) {
                $rootScope.pendingRequests -= 1;
                if ($rootScope.pendingRequests === 0) {
                    $rootScope.loading = false;
                }
                return response;
            },
            'responseError': function(rejection) {
                $rootScope.pendingRequests -= 1;
                if ($rootScope.pendingRequests === 0) {
                    $rootScope.loading = false;
                }
                return $q.reject(rejection);
            }
        };
    };
});