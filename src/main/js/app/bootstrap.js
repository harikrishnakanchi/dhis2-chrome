require.config({
    baseUrl: "js/"
});

require(["app/app.config"], function(config) {
    require(["app/app", "properties"], function(app, properties) {
        app.bootstrap(app.init());
    });
});