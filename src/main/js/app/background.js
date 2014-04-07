require.config({
    baseUrl: "js/"
});

require(["app/background.config"], function(config) {
    require(["indexedDBLogger"], function(indexedDBLogger) {
        indexedDBLogger.configure("msfLogs");
        require(["backgroundServicesRegistry", "metadataSyncService", "properties"], function(backgroundServicesRegistry, metadataSyncService, properties) {
            var scheduleSync = function() {
                console.log("scheduling sync");
                chrome.alarms.create('metadataSyncAlarm', {
                    periodInMinutes: properties.metadata.sync.intervalInMinutes
                });
            };

            window.addEventListener('online', function(e) {
                console.log("starting sync");
                metadataSyncService.sync();
                scheduleSync();
            });

            window.addEventListener('offline', function() {
                console.log("stopping sync");
                chrome.alarms.clear('metadataSyncAlarm');
            });

            chrome.app.runtime.onLaunched.addListener(function(launchData) {
                chrome.app.window.create('../../index.html', {
                    id: 'DHIS2',
                    state: 'fullscreen'
                });
            });

            var init = function() {
                backgroundServicesRegistry.register();
                if (navigator.onLine)
                    scheduleSync();
            };

            init();
        });
    });
});