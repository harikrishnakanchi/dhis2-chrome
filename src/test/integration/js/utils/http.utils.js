define([], function() {
    var httpService = dhis.injector.get("$http");
    var baseUrl = "http://localhost:8888/dhis";

    var httpGet = function(apiUrl, params) {
        return httpService.get(baseUrl + apiUrl, {
            "params": params
        });
    };

    var httpPost = function(apiUrl, payload, headers) {
        var httpPostParams = {
            method: 'POST',
            url: baseUrl + apiUrl,
            data: payload
        };
        if (headers) {
            httpPostParams.headers = headers;
        }
        return httpService(httpPostParams);
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
