require.config({
    baseUrl: "js/"
});

require(["app/pwa.config", "app/shared.config"], function() {
    require(["app/app", "chromeUtils"], function(app, chromeUtils) {
        var initializeForeground = function () {
            app.bootstrap(app.init());
        };

        self.worker = new Worker('js/app/pwa.bg.bootstrap.js');
        chromeUtils.init();
        chromeUtils.addListener("backgroundReady", initializeForeground);
    });
});