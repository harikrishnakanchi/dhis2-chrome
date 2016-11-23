require.config({
    baseUrl: "js/"
});

require(["app/pwa/pwa.app.config", "app/shared.app.config"], function() {
    require(["app/app", "platformUtils"], function(app, platformUtils) {
        var initializeForeground = function () {
            app.bootstrap(app.init());
        };

        self.worker = new Worker('js/app/pwa/pwa.bg.bootstrap.js');
        platformUtils.init();
        platformUtils.addListener("backgroundReady", initializeForeground);
    });
});