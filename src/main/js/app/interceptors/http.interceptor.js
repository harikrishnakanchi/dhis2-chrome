define(["properties", "chromeRuntime", "lodash"], function(properties, chromeRuntime, _) {
    return function($rootScope, $q) {
        $rootScope.pendingRequests = 0;
        return {
            'request': function(config) {

                removeUnnecessaryFieldsFromPayload = function() {
                    var removeLastUpdatedAndCreatedFromCollection = function(collection) {
                        return _.omit(collection, ["lastUpdated", "created"]);
                    };

                    var removeLastUpdatedAndCreatedFromArray = function(data) {
                        return _.map(data, function(datum) {
                            return removeLastUpdatedAndCreatedFromCollection(datum);
                        });
                    };

                    if (config.method === "POST" && !_.isEmpty(config.data)) {
                        var keys = _.keys(config.data);
                        if (keys.length === 1) {
                            config.data[keys[0]] = removeLastUpdatedAndCreatedFromArray(config.data[keys[0]]);
                        } else {
                            config.data = removeLastUpdatedAndCreatedFromCollection(config.data);
                        }
                    }
                };

                removeUnnecessaryFieldsFromPayload();
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