define(["Q"], function(Q) {
    var dbName = "appSettings";
    var storeName = "appSettingsStore";
    var getDb = function() {
        var dbDeferred = Q.defer();
        var request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            var store = db.createObjectStore(storeName, {
                autoIncrement: true,
                keyPath: "key"
            });
        };
        request.onsuccess = function(event) {
            var db = event.target.result;
            dbDeferred.resolve(db);
        };

        request.onerror = function(event) {
            dbDeferred.reject(event);
        };

        return dbDeferred.promise;
    };

    var upsert = function(key, value) {
        var addDeferred = Q.defer();
        getDb().then(function(db) {

            var trans = db.transaction(storeName, "readwrite");
            var store = trans.objectStore(storeName);
            var addRequest = store.put({
                "key": key,
                "value": value
            });

            addRequest.onsuccess = function(event) {
                addDeferred.resolve(event);
            };

            addRequest.onerror = function(event) {
                addDeferred.reject(event);
            };

            trans.commit();
        });
        return addDeferred.promise;
    };

    var get = function(key) {
        var getDeferred = Q.defer();

        getDb().then(function(db) {

            var trans = db.transaction(storeName, "readonly");
            var cursor = IDBKeyRange.only(key);
            var store = trans.objectStore(storeName);
            var getRequest = store.openCursor(cursor);

            getRequest.onsuccess = function(event) {


                getDeferred.resolve(event.target.result);
            };

            getRequest.onerror = function(event) {
                getDeferred.reject(event);
            };

            trans.commit();
        });

        return getDeferred.promise;
    };

    return {
        "upsert": upsert,
        "get": get
    };
});
