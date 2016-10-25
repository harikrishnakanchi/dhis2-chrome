require.config({
    baseUrl: "js/"
});

require(["app/app.config", "app/shared.config"], function(config) {
    require(["app/app"], function(app) {
        app.bootstrap(app.init());
    });
});