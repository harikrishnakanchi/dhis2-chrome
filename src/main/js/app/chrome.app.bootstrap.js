require.config({
    baseUrl: "js/"
});

require(["app/chrome.app.config", "app/shared.app.config"], function(config) {
    require(["app/app"], function(app) {
        app.bootstrap(app.init());
    });
});