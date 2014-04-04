var idb = function() {
    var db;

    var openDb = function(dbName) {
        var request = indexedDB.open(dbName);
        var defer = Q.defer();
        request.onsuccess = function(e) {
            db = e.target.result;
            defer.resolve(db);
        };
        request.onerror = function(e) {
            defer.reject(e);
        };
        return defer.promise;
    };

    var get = function(storeName, key, transaction) {
        transaction = transaction || db.transaction(storeName, "readonly");
        var store = db.transaction(storeName, "readonly").objectStore(storeName);
        return promisify(store.get(key));
    };

    var put = function(storeName, value, transaction) {
        transaction = transaction || db.transaction(storeName, "readwrite");
        var store = transaction.objectStore(storeName);
        return promisify(store.put(value));
    };

    var promisify = function(request) {
        var deferred = Q.defer();
        request.onsuccess = function(e) {
            deferred.resolve(e.target.result);
        };
        request.onerror = function(e) {
            deferred.reject(e);
        };
        return deferred.promise;
    };

    var usingTransaction = function(storeNames, fn) {
        var transaction = db.transaction(storeNames, "readwrite");
        return fn(transaction);
    };

    return {
        "openDb": openDb,
        "get": get,
        "put": put,
        "usingTransaction": usingTransaction,
    };
}();