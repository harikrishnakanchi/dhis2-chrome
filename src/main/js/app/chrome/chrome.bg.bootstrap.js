require.config({
    baseUrl: "js/"
});

require(["app/chrome/chrome.bg.config", "app/shared.bg.config"], function(config) {
    require(["app/bg.app"], function(app) {
        require(["properties", "platformUtils"], function(properties, platformUtils) {
            var bootstrapData;
            var onDbReady = function(request, sender, sendResponse) {
                if (!bootstrapData) {
                    console.log("dB ready");
                    app.bootstrap(app.init()).then(function(data) {
                        bootstrapData = data;
                    });
                }
            };

            platformUtils.addListener('dbReady', onDbReady);
            chrome.app.runtime.onLaunched.addListener(function(launchData) {
                chrome.app.window.create('../../chrome.app.html', {
                    id: 'PRAXIS',
                    state: 'maximized'
                });
            });
        });
    });
});
