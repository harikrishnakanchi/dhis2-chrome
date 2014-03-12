require.config({
    baseUrl: "js/"
});

require(["app/app.config"], function(config) {
    require(["migrator", "migrations"], function(migrator, migrations) {
        var dbPromise = migrator.run("msf", migrations);
        dbPromise.then(function(db) {
            require(["app/app", "properties"], function(app, properties) {
                console.log(properties);
                app.bootstrap(app.init(db));
            });
        });
    });
});