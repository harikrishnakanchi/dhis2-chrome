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

    var getMockStore = function(q, findResult, allResult, eachResult) {
        return {
            "upsert": jasmine.createSpy("upsert").and.callFake(function(data) {
                return getPromise(q, data);
            }),
            "insert": jasmine.createSpy("insert").and.callFake(function(data) {
                return getPromise(q, data);
            }),
            "delete": jasmine.createSpy("delete").and.returnValue(getPromise(q, {})),
            "find": jasmine.createSpy("find").and.returnValue(getPromise(q, findResult)),
            "getAll": jasmine.createSpy("getAll").and.returnValue(getPromise(q, allResult)),
            "each": jasmine.createSpy("each").and.returnValue(getPromise(q, eachResult)),
            "clear": jasmine.createSpy("clear").and.returnValue(getPromise(q, {})),
            "exists": jasmine.createSpy("exists").and.returnValue(getPromise(q, {}))
        };
    };

    var getMockDB = function(q, findResult, allResult, eachResult, dbInfo) {
        var mockStore = getMockStore(q, findResult, allResult, eachResult);

        var queryBuilder = function() {

            this.$index = function(index) {
                this.index = index;
                return this;
            };
            this.$in = function(inList) {
                this.inList = inList;
                return this;
            };
            this.$eq = function(eq) {
                this.eq = eq;
                return this;
            };
            this.$between = function(betweenX, betweenY) {
                this.betweenX = betweenX;
                this.betweenY = betweenY;
                return this;
            };
            this.compile = function() {
                return this;
            };
            return this;
        };

        var getQueryBuilder = function() {
            return new queryBuilder();
        };

        var db = {
            "objectStore": jasmine.createSpy("objectStore").and.callFake(function(storeName) {
                mockStore.storeName = storeName;
                return mockStore;
            }),
            "queryBuilder": getQueryBuilder,
            "dbInfo": jasmine.createSpy("dbInfo").and.returnValue(getPromise(q, dbInfo)),
            "switchDB": jasmine.createSpy("switchDB").and.callFake(function() {
                return;
            })
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
            getAll: jasmine.createSpy("getAll").and.returnValue(getPromise(q, allResults)),
            getAllProjects: jasmine.createSpy("getAllProjects").and.returnValue(getPromise(q, allResults)),
            getAllModulesInOrgUnitsExceptCurrentModules: jasmine.createSpy("getAllModulesInOrgUnitsExceptCurrentModules").and.returnValue(getPromise(q, allResults))
        };
    };

    return {
        'getPromise': getPromise,
        'getRejectedPromise': getRejectedPromise,
        'getMockDB': getMockDB,
        'getMockRepo': getMockRepo,
        'getMockStore': getMockStore
    };
});
