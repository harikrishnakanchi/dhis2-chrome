require.config({
    baseUrl: "js/"
});

require(["app/bg.config"], function(config) {
    require(["indexedDBLogger", "app"], function(indexedDBLogger, app) {
        indexedDBLogger.configure("msfLogs");
        require(["properties"], function(properties) {
            var bootstrapData;
            var onMigrationComplete = function(request, sender, sendResponse) {
                if (!bootstrapData && request === "migrationComplete") {
                    console.log("dB migration complete");
                    app.bootstrap(app.init()).then(function(data) {
                        bootstrapData = data;
                    });
                }
            };

            chrome.runtime.onMessage.addListener(onMigrationComplete);
            chrome.app.runtime.onLaunched.addListener(function(launchData) {
                chrome.app.window.create('../../index.html', {
                    id: 'DHIS2',
                    state: 'fullscreen'
                });
            });
        });
    });
});