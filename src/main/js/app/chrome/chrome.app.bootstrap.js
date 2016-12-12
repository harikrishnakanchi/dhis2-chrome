require.config({
    baseUrl: "js/"
});

self.basePath = "./";

require(["app/chrome/chrome.app.config", "app/shared.app.config"], function(config) {
    require(["app/app", "platformUtils"], function(app, platformUtils) {
        app.bootstrap(app.init());

        window.addEventListener('online', function () {
            platformUtils.sendMessage('online');
        });

        window.addEventListener('offline', function () {
            platformUtils.sendMessage('offline');
        });
    });
});