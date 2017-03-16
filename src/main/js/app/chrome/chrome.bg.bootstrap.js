require.config({
    baseUrl: "js/"
});

self.basePath = "./";

require(["app/chrome/chrome.bg.config", "app/shared.bg.config"], function(config) {
    require(["app/bg.app"], function(app) {
        require(["platformUtils", "lodash"], function(platformUtils, _) {
            var onDbReady = function() {
                console.log("DB Ready");
                app.bootstrap(app.init());
            };
            platformUtils.init();

            platformUtils.addListener('dbReady', _.once(onDbReady));
            chrome.app.runtime.onLaunched.addListener(function(launchData) {
                chrome.app.window.create('../../chrome.app.html', {
                    id: 'PRAXIS',
                    state: 'maximized'
                });
            });
        });
    });
});
