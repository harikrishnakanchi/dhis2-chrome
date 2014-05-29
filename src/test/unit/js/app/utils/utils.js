define([], function() {
    var getPromise = function(q, response) {
        response = response || '';
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

    var getMockDB = function(q) {
        var mockStore = {
            upsert: jasmine.createSpy("upsert").and.callFake(function(data) {
                return getPromise(q, data);
            }),
            find: jasmine.createSpy("find"),
            getAll: jasmine.createSpy("getAll")
        };
        var db = {
            "objectStore": jasmine.createSpy("objectStore").and.callFake(function() {
                return mockStore;
            })
        };

        return {
            "db": db,
            "objectStore": mockStore
        };
    };

    return {
        'getPromise': getPromise,
        'getRejectedPromise': getRejectedPromise,
        'getMockDB': getMockDB
    };
});