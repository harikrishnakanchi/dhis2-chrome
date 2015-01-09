define([], function() {
    var httpService = dhis.injector.get("$http");
    var baseUrl = "http://localhost:8080";

    var get = function(apiUrl, params) {
        return httpService.get(baseUrl + apiUrl, {
            "params": params
        });
    };

    return {
        "GET": get
    };
});
