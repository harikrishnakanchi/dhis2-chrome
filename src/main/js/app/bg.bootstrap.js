require.config({
    baseUrl: "js/"
});

require(["app/bg.config"], function(config) {
    require(["indexedDBLogger", "app"], function(indexedDBLogger, app) {
        indexedDBLogger.configure("msfLogs");
        require(["properties"], function(properties) {
            var scheduleSync = function() {
                console.log("scheduling sync");
                chrome.alarms.create('metadataSyncAlarm', {
                    periodInMinutes: properties.metadata.sync.intervalInMinutes
                });
            };

            var onMigrationComplete = function(request, sender, sendResponse) {
                if (request === "migrationComplete") {
                    app.bootstrap(app.init());
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