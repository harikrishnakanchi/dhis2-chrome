define(["properties"], function(properties) {
    return function($rootScope, systemSettingRepository) {
        return {
            'request': function(config) {
                config.timeout = properties.http.timeout;
                if (config.url.indexOf(properties.dhis.url) === 0) {
                    config.headers.Authorization = systemSettingRepository.getAuthHeader();
                }
                return config;
            }
        };
    };
});
