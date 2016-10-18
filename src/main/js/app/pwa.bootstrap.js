require.config({
    baseUrl: "js/"
});

require(["app/pwa.config"], function(config) {
    require(["app/app"], function(app) {
        app.bootstrap(app.init());
    });
});