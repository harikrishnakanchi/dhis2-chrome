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

    var getMockDB = function(q, findResult, allResult, eachResult) {
        var mockStore = {
            "upsert": jasmine.createSpy("upsert").and.callFake(function(data) {
                return getPromise(q, data);
            }),
            "delete": jasmine.createSpy("delete").and.returnValue(getPromise(q, {})),
            "find": jasmine.createSpy("find").and.returnValue(getPromise(q, findResult)),
            "getAll": jasmine.createSpy("getAll").and.returnValue(getPromise(q, allResult)),
            "each": jasmine.createSpy("each").and.returnValue(getPromise(q, eachResult)),
        };
        var queryBuilder = function() {
            this.$index = function() {
                return this;
            };
            this.$eq = function(v) {
                return this;
            };
            this.$between = function(v) {
                return this;
            };
            this.compile = function() {
                return "blah";
            };
            return this;
        };

        var db = {
            "objectStore": jasmine.createSpy("objectStore").and.callFake(function() {
                return mockStore;
            }),
            "queryBuilder": queryBuilder
        };

        return {
            "db": db,
            "objectStore": mockStore
        };
    };

    var getMockRepo = function(q, allResults) {
        return {
            upsert: jasmine.createSpy("upsert").and.callFake(function(data) {
                return getPromise(q, data);
            }),
            getAll: jasmine.createSpy("getAll").and.returnValue(getPromise(q, allResults))
        };
    };

    return {
        'getPromise': getPromise,
        'getRejectedPromise': getRejectedPromise,
        'getMockDB': getMockDB,
        'getMockRepo': getMockRepo
    };
});