window.addEventListener('online', function(e) {
    console.log("starting sync");
    msf.metadata.sync();
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