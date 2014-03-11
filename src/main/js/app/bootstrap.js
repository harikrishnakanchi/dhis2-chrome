require.config({
    baseUrl: "js/"
});

require(["app/app.config"], function(config) {
    require(["migrator", "migrations"], function(migrator, migrations) {
        migrator.run("msf", migrations);
        require(["app/app"], function(app) {
            app.bootstrap(app.init());
        });
    });
});