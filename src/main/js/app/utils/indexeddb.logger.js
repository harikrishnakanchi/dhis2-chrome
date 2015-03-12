define(["lodash", "Q", "moment", "properties"], function(_, Q, moment, properties) {

    var logStoreName = 'logs';

    var configure = function(dbName, loggerDelegate) {

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
                store.createIndex("datetime", "datetime", {
                    unique: false
                });
            };

            request.onsuccess = function(e) {
                d.resolve(e.target.result);
            };

            request.onerror = function(e) {
                console.error("Could not set up log db", e);
                d.reject(e.target.result);
            };

            return d.promise;
        };

        var cleanupOldEntires = function(logDb) {
            var d = Q.defer();

            var boundKeyRange = IDBKeyRange.upperBound(moment().subtract(properties.logging.maxAgeinHours, "hours").toISOString());
            var transaction = logDb.transaction(logStoreName, "readwrite");
            var store = transaction.objectStore(logStoreName);
            var index = store.index("datetime");
            var req = index.openCursor(boundKeyRange);
            req.onsuccess = function(e) {
                var onfound = function() {
                    console.debug("Deleting log entry for " + cursor.key);
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                };

                var onfinish = function() {
                    d.resolve(logDb);
                };

                var cursor = e.target.result;
                if (!cursor) {
                    onfinish();
                    return;
                }
                onfound();
            };

            req.onerror = function(e) {
                console.error("Could not clean up old entries", e);
                d.resolve(logDb);
            };

            return d.promise;
        };


        var wireupLogging = function(logDb) {

            var putLog = function(logLevel, args) {
                try {
                    var transaction = logDb.transaction(logStoreName, "readwrite");
                    var store = transaction.objectStore(logStoreName);
                    var logObject = {
                        'method': logLevel,
                        'datetime': moment().toISOString(),
                        'arguments': args
                    };
                    store.put(logObject);
                } catch (e) {
                    //burp
                }
            };

            var originalInfoLogger = loggerDelegate.info;
            loggerDelegate.info = function() {
                putLog('info', arguments);
                originalInfoLogger.apply(null, arguments);
            };

            var originalWarningLogger = loggerDelegate.warn;
            loggerDelegate.warn = function() {
                putLog('warning', arguments);
                originalWarningLogger.apply(null, arguments);
            };

            var originalErrorLogger = loggerDelegate.error;
            loggerDelegate.error = function() {
                putLog('error', arguments);
                originalErrorLogger.apply(null, arguments);
            };

            return logDb;
        };

        return setupLogDb()
            .then(cleanupOldEntires)
            .then(wireupLogging);
    };

    return {
        "configure": configure
    };
});