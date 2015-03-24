define(["properties"], function(properties) {
    return function($rootScope) {
        return {
            'request': function(config) {
                config.timeout = properties.http.timeout;
                if (config.url.indexOf(properties.dhis.url) === 0) {
                    config.headers.Authorization = $rootScope.auth_header;
                }
                return config;
            }
        };
    };
});
