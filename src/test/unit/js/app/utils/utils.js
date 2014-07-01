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

    var getMockDB = function(q, findResult, allResult) {
        var mockStore = {
            upsert: jasmine.createSpy("upsert").and.callFake(function(data) {
                return getPromise(q, data);
            }),
            find: jasmine.createSpy("find").and.returnValue(getPromise(q, findResult)),
            getAll: jasmine.createSpy("getAll").and.returnValue(getPromise(q, allResult))
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

    var getMockRepo = function(q) {
        return {
            upsert: jasmine.createSpy("upsert").and.callFake(function(data) {
                return getPromise(q, data);
            })
        };
    };

    return {
        'getPromise': getPromise,
        'getRejectedPromise': getRejectedPromise,
        'getMockDB': getMockDB,
        'getMockRepo': getMockRepo
    };
});