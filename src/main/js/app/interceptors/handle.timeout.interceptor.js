define(["properties", "chromeRuntime"], function(properties, chromeRuntime) {
    return function($q) {
        return {
            'responseError': function(rejection) {
                if (rejection.status === 0 && rejection.config.url.indexOf(properties.dhisPing.url) !== 0) {
                    chromeRuntime.sendMessage("checkNow");
                }
                return $q.reject(rejection);
            }
        };
    };
});