chrome.app.runtime.onLaunched.addListener(function(launchData) {
    chrome.app.window.create('../../templates/index.html', {
        id: 'DHIS2'
    });
});

chrome.runtime.onInstalled.addListener(function() {
    console.log('DHIS2 Chrome extension installed successfully.');
});