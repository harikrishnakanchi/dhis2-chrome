define(["properties", "chromeUtils"], function(properties, chromeUtils) {
    return function($q) {
        return {
            'responseError': function(rejection) {
                if (rejection.status === 0 && rejection.config.url.indexOf(properties.dhisPing.url) !== 0) {
                    chromeUtils.sendMessage("checkNow");
                }
                return $q.reject(rejection);
            }
        };
    };
});
