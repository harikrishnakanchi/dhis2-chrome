define([], function() {
    var configure = function(dbName) {
        var storeName = 'logs';

        var _log = console.log,
            _debug = console.debug,
            _error = console.error;

        var logDb = {};

        var request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = function(e) {
            var db = e.target.result;
            var store = db.createObjectStore(storeName, {
                autoIncrement: true
            });
            store.createIndex("method", "method", {
                unique: false
            });
            store.createIndex("time", "time", {
                unique: false
            });
        };

        request.onsuccess = function(e) {
            logDb = e.target.result;
        };

        var putLog = function(logLevel, args) {
            var transaction = logDb.transaction(storeName, "readwrite");
            var store = transaction.objectStore(storeName);
            store.put({
                'method': logLevel,
                'time': new Date(),
                'arguments': args
            });
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
    };

    return {
        "configure": configure,
    };
});