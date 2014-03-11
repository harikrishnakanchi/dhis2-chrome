define(["Q"], function(q) {
    var run = function(db, migrations) {
        var deferred = q.defer();
        var request = indexedDB.open(db, migrations.length);
        request.onsuccess = function(e) {
            console.log("success");
            deferred.resolve(e.target.result);
        };
        request.onerror = function(e) {
            console.log("error");
            deferred.reject(e);
        };
        request.onupgradeneeded = function(e) {
            console.log("upgrading");
            var db = e.target.result;
            for (var i = e.oldVersion; i < migrations.length; i++) {
                console.log("running migration " + i);
                migrations[i].call(this, db);
            }
            console.log("upgraded");
        };
        return deferred.promise;
    };

    return {
        'run': run
    };
});