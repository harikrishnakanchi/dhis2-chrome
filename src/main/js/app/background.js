chrome.app.runtime.onLaunched.addListener(function(launchData) {
    chrome.app.window.create('../../index.html', {
        id: 'DHIS2',
        state: 'fullscreen'
    });
});

chrome.runtime.onInstalled.addListener(function() {
    chrome.alarms.create('metadataSyncAlarm', {
        periodInMinutes: properties.metadata.sync.intervalInMinutes
    });
});