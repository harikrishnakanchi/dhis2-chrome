define(["jquery", "properties", "Q"], function($, properties, Q) {
    $.ajaxPrefilter(function(options) {
        if (!options.beforeSend) {
            options.beforeSend = function(xhr) {
                xhr.setRequestHeader('Authorization', properties.metadata.auth_header);
            };
        }
    });

    var get = function(url) {
        var deferred = Q.defer();
        $.get(url).done(function(data) {
            deferred.resolve(data);
        }).fail(function(data) {
            console.log("Failed to fetch url: " + url);
            deferred.reject(data);
        });

        return deferred.promise;
    };
    return {
        "get": get
    };
});