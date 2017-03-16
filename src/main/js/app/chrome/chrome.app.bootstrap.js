require.config({
    baseUrl: "js/"
});

self.basePath = "./";

require(["app/chrome/chrome.app.config", "app/shared.app.config"], function(config) {
    require(["app/app", "platformUtils", "moment"], function(app, platformUtils, moment) {
        window.moment = moment;
        app.bootstrap(app.init()).then(function () {
            platformUtils.sendMessage('dbReady');
        });

        platformUtils.init();

        window.addEventListener('online', function () {
            platformUtils.sendMessage('online');
        });

        window.addEventListener('offline', function () {
            platformUtils.sendMessage('offline');
        });
    });
});