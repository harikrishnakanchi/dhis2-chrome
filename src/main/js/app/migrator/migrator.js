define(["Q", "lodash"], function(q, _) {
    var run = function(db, migrations) {
        var deferred = q.defer();
        var migrationFunctions = _.values(migrations);
        var request = indexedDB.open(db, migrationFunctions.length);
        request.onsuccess = function(e) {
            console.log("success");
            deferred.resolve(e.target.result);
        };
        request.onerror = function(e) {
            console.log("error " + e);
            deferred.reject(e);
        };
        request.onupgradeneeded = function(e) {
            console.log("upgrading");
            var db = e.target.result;
            for (var i = e.oldVersion; i < migrationFunctions.length; i++) {
                console.log("running migration " + i);
                migrationFunctions[i].call(this, db);
            }
            console.log("upgraded");
        };
        return deferred.promise;
    };

    return {
        'run': run
    };
});