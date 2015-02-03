define(["properties"], function(properties) {
    return function() {
        return {
            'request': function(config) {
                config.timeout = properties.http.timeout;
                if (config.url.indexOf(properties.dhis.url) === 0) {
                    config.headers.Authorization = properties.dhis.auth_header;
                }

                return config;
            }
        };
    };
});