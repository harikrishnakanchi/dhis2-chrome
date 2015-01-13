define([], function() {
    var httpService = dhis.injector.get("$http");
    var baseUrl = "http://localhost:8080";

    var httpGet = function(apiUrl, params) {
        return httpService.get(baseUrl + apiUrl, {
            "params": params
        });
    };

    var httpPost = function(apiUrl, payload) {
        return httpService.post(baseUrl + apiUrl, payload);
    };

    var httpDelete = function(apiUrl, params) {
        return httpService.delete(baseUrl + apiUrl, {
            "params": params
        });
    };

    return {
        "GET": httpGet,
        "POST": httpPost,
        "DELETE": httpDelete
    };
});
