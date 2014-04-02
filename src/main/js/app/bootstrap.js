require.config({
    baseUrl: "js/"
});

require(["app/app.config"], function(config) {
    require(["app/app"], function(app) {
        app.bootstrap(app.init());
    });
});