define(["lodash"], function(_) {
    return function() {
        return {
            'request': function(config) {

                var cleanUp = function(payload) {
                    if (_.isArray(payload)) {
                        _.forEach(payload, function(item, index) {
                            payload[index] = cleanUp(item);
                        });
                        return payload;
                    }

                    payload = _.omit(payload, ["lastUpdated", "created", "href"]);
                    var keys = _.keys(payload);
                    _.forEach(keys, function(key) {
                        if (_.isPlainObject(payload[key]) || _.isArray(payload[key]))
                            payload[key] = cleanUp(payload[key]);
                    });

                    return payload;
                };

                if ((config.method === "POST" || config.method === "PUT") && !_.isEmpty(config.data) && !_.isString(config.data)) {
                    config.data = cleanUp(config.data);
                }
                return config;
            }
        };
    };
});
