require.config({
    baseUrl: "js/"
});

require(["app/bg.config"], function(config) {
    require(["app/bg.app"], function(app) {
        require(["properties"], function(properties) {
            var bootstrapData;
            var onDbReady = function(request, sender, sendResponse) {
                if (!bootstrapData && request === "dbReady") {
                    console.log("dB ready");
                    app.bootstrap(app.init()).then(function(data) {
                        bootstrapData = data;
                    });
                }
            };

            chrome.runtime.onMessage.addListener(onDbReady);
            chrome.app.runtime.onLaunched.addListener(function(launchData) {
                chrome.app.window.create('../../index.html', {
                    id: 'PRAXIS',
                    state: 'maximized'
                });
            });
        });
    });
});
