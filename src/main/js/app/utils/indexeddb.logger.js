define(["lodash", "Q", "moment", "properties"], function(_, Q, moment, properties) {

    var logStoreName = 'logs';

    var configure = function(dbName) {

        var setupLogDb = function() {
            var d = Q.defer();
            var request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore(logStoreName, {
                    autoIncrement: true
                });
                store.createIndex("method", "method", {
                    unique: false
                });
                store.createIndex("timestamp", "timestamp", {
                    unique: false
                });
            };

            request.onsuccess = function(e) {
                d.resolve(e.target.result);
            };

            return d.promise;
        };

        var cleanupOldEntires = function(logDb) {
            var transaction = logDb.transaction(logStoreName, "readwrite");
            var store = transaction.objectStore(logStoreName);

            var getItemsToDelete = function() {
                var d = Q.defer();
                var results = [];

                var boundKeyRange = IDBKeyRange.lowerBound(moment().subtract(properties.logging.maxAgeinDays, "days").format("x"));
                var index = store.index("timestamp");
                var req = index.openCursor(boundKeyRange);
                req.onsuccess = function(e) {
                    var onfound = function() {
                        results.push(cursor.key);
                        cursor.continue();
                    };

                    var onfinish = function() {
                        d.resolve(results);
                    };

                    var cursor = e.target.result;
                    if (!cursor) {
                        onfinish();
                        return;
                    }
                    onfound();
                };

                req.onerror = function(e) {
                    d.reject(e.target.result);
                };

                return d.promise;
            };

            var deleteThem = function(ids) {
                var d = Q.defer();
                var deleteLogEntry = function(id) {
                    var req = store.delete(id);
                    req.onsuccess = req.onerror = function(e) {
                        d.resolve(e.target.result);
                    };
                    return d.promise;
                };

                var promises = [];
                _.each(ids, function(id) {
                    promises.push(deleteLogEntry(id));
                });

                return Q.all(promises);
            };

            return getItemsToDelete()
                .then(deleteThem)
                .then(function() {
                    return logDb
                });
        };


        var wireupLogging = function(logDb) {
            console.log("qwe3");
            var _log = console.log,
                _debug = console.debug,
                _error = console.error;

            var putLog = function(logLevel, args) {
                try {
                    var transaction = logDb.transaction(logStoreName, "readwrite");
                    var store = transaction.objectStore(logStoreName);
                    var logObject = {
                        'method': logLevel,
                        'timestamp': moment().format("x"),
                        'arguments': args
                    };
                    store.put(logObject);
                } catch (e) {
                    //burp
                }
            };

            console.debug = function() {
                putLog('debug', arguments);
                return _debug.apply(console, arguments);
            };

            console.log = function() {
                putLog('info', arguments);
                return _log.apply(console, arguments);
            };

            console.error = function() {
                putLog('error', arguments);
                return _error.apply(console, arguments);
            };

            return logDb;
        };

        setupLogDb()
            .then(cleanupOldEntires)
            .then(wireupLogging);
    };

    return {
        "configure": configure
    };
});
