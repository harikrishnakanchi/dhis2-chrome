define([], function() {
    var getPromise = function(q, response) {
        var deferred = q.defer();
        deferred.resolve(response);
        return deferred.promise;
    };

    var getRejectedPromise = function(q, response) {
        response = response || '';
        var deferred = q.defer();
        deferred.reject(response);
        return deferred.promise;
    };

    return {
        'getPromise': getPromise,
        'getRejectedPromise': getRejectedPromise
    };
});
