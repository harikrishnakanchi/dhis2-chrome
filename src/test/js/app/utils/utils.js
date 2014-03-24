define([], function() {
    var getPromise = function(q, response) {
        response = response || '';
        var deferred = q.defer();
        deferred.resolve(response);
        return deferred.promise;
    };

    return {
        'getPromise': getPromise
    };
});