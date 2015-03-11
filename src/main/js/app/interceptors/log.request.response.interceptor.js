define([], function() {
    return function($log) {
        return {
            'request': function(config) {
                if (!config.method)
                    return config;

                var method = config.method;
                if (method === "GET")
                    $log.info("Request", config.method, config.url);
                if (method === "POST" || method === "PUT" || method === "DELETE")
                    $log.info("Request", config.method, config.url, config.data);

                return config;
            },
            'response': function(response) {
                if (!response.config)
                    return response;

                var method = response.config.method;
                if (method === "GET")
                    $log.info("Response", response.config.method, response.config.url, response.data);
                if (method === "POST" || method === "PUT" || method === "DELETE")
                    $log.info("Response", response.config.method, response.config.url, response.config.data, response.data);

                return response;
            }

        };
    };
});
