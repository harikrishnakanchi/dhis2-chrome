require.config({
    baseUrl: "js/"
});

require(["app/background.config"], function(config) {
    require(["backgroundServicesRegistry", "indexedDBLogger", "metadataSyncService", "properties"], function(backgroundServicesRegistry, indexedDBLogger, metadataSyncService, properties) {
        indexedDBLogger.configure("msfLogs");

        window.addEventListener('online', function(e) {
            console.log("starting sync");
            metadataSyncService.sync();
            chrome.alarms.create('metadataSyncAlarm', {
                periodInMinutes: properties.metadata.sync.intervalInMinutes
            });
        });

        window.addEventListener('offline', function(e) {
            console.log("stopping sync");
            chrome.alarms.clear('metadataSyncAlarm');
        });

        chrome.app.runtime.onLaunched.addListener(function(launchData) {
            chrome.app.window.create('../../index.html', {
                id: 'DHIS2',
                state: 'fullscreen'
            });
        });

        backgroundServicesRegistry.register();
    });
});