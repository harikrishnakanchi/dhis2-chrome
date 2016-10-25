require.config({
    baseUrl: "js/"
});

require(["app/pwa.config", "app/shared.config"], function(config) {
    require(["app/app"], function(app) {
        app.bootstrap(app.init());
    });
});