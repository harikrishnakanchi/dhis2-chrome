define(["lodash"], function(_) {
    var httpService = dhis.injector.get("$http");
    var baseUrl = "http://localhost:8888/dhis";

    var httpGet = function(apiUrl, params) {
        return httpService.get(baseUrl + apiUrl, {
            "params": params
        });
    };

    var httpPost = function(apiUrl, payload, headers) {
        var defultHeaders = {
            "Content-Type": 'application/json'
        };
        return httpService.post(baseUrl + apiUrl, payload).then(function(data) {
            console.error("post sucess " + JSON.stringify(data) + "url :" + apiUrl);
            return data;
        }, function(data, status, headers, config) {
            console.error("error posting to " + apiUrl + "status :" + status + "data :" + data);
            return data;
        });
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