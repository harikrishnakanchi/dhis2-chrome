require.config({
    baseUrl: "js/",
    waitSeconds: 0
});

self.basePath = "./";

require(["app/pwa/pwa.app.config", "app/shared.app.config"], function() {
    require(["app/app", "platformUtils", "moment"], function(app, platformUtils, moment) {
        window.moment = moment;
        var initializeForeground = function () {
            app.bootstrap(app.init());
        };

        self.worker = new Worker('js/app/pwa/pwa.bg.bootstrap.js');
        platformUtils.init();
        platformUtils.addListener("backgroundReady", initializeForeground);

        window.addEventListener('online', function () {
            platformUtils.sendMessage('online');
        });

        window.addEventListener('offline', function () {
            platformUtils.sendMessage('offline');
        });
    });
});