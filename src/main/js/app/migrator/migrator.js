define(["Q", "lodash"], function(q, _) {
    var run = function(oldVersion, db, tx, migrations) {
        for (var i = oldVersion; i < migrations.length; i++) {
            console.log("running migration " + i);
            migrations[i].call(this, db, tx);
        }
    };

    return {
        'run': run
    };
});