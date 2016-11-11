require.config({
    baseUrl: "js/"
});

self.worker = new Worker('js/app/pwa.bg.bootstrap.js');

require(["app/pwa.config", "app/shared.config"], function(config) {
    require(["app/app", "chromeUtils"], function(app, chromeUtils) {
        var initializeForeground = function () {
            app.bootstrap(app.init());
        };
        chromeUtils.addListener("backgroundReady", initializeForeground);
    });
});