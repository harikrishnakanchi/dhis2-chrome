define(["lodash", "Q", "moment", "properties"], function(_, Q, moment, properties) {

    var logStoreName = 'logs';

    var getLogDb = function(dbName) {
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

    var configure = function(dbName, loggerDelegate) {

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

            var putLog = function(logLevel, messages) {
                try {
                    var transaction = logDb.transaction(logStoreName, "readwrite");
                    var store = transaction.objectStore(logStoreName);
                    var logObject = {
                        'method': logLevel,
                        'datetime': moment().toISOString(),
                        'messages': messages
                    };
                    var req = store.put(logObject);
                    req.onerror = function(e){
                        console.error("Could not save log entry to indexedDB", e, logObject);
                    };
                } catch (e) {
                    console.error("Could not save log entry to indexedDB", e, messages);
                    //burp
                }
            };

            var parseArgsForMessages = function(args) {
                var messages = _.map(args, function(arg) {
                    if (arg.stack)
                        return arg.stack;
                    return arg;
                });
                return messages;
            };

            var originalInfoLogger = loggerDelegate.info;
            loggerDelegate.info = function() {
                putLog('info', parseArgsForMessages(arguments));
                originalInfoLogger.apply(null, arguments);
            };

            var originalWarningLogger = loggerDelegate.warn;
            loggerDelegate.warn = function() {
                putLog('warning', parseArgsForMessages(arguments));
                originalWarningLogger.apply(null, arguments);
            };

            var originalErrorLogger = loggerDelegate.error;
            loggerDelegate.error = function() {
                putLog('error', parseArgsForMessages(arguments));
                originalErrorLogger.apply(null, arguments);
            };

            return logDb;
        };

        return getLogDb(dbName)
            .then(cleanupOldEntires)
            .then(wireupLogging);
    };

    var exportLogs = function(dbName) {
        return getLogDb(dbName).then(function(logDb) {
            var results = [];
            var d = Q.defer();
            var transaction = logDb.transaction(logStoreName, "readonly");
            var store = transaction.objectStore(logStoreName);
            req = store.openCursor();
            req.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.
                    continue();
                } else {
                    d.resolve({
                        "msfLogs": results
                    });
                }
            };
            req.onerror = function(e) {
                console.error("Could not export logs", e);
                d.reject(e.target.result);
            };

            return d.promise;
        });
    };

    return {
        "configure": configure,
        "exportLogs": exportLogs
    };
});