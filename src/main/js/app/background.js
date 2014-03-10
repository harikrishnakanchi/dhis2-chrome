chrome.app.runtime.onLaunched.addListener(function(launchData) {
    chrome.app.window.create('../../index.html', {
        id: 'DHIS2',
        state: 'fullscreen'
    });
});

console.log(migrations);

chrome.runtime.onInstalled.addListener(function() {
    var request = indexedDB.open("msf", migrations.length);
    request.onsuccess = function(e) {
        console.log("success");
    };
    request.onerror = function() {
        console.log("error");
    };
    request.onupgradeneeded = function(e) {
        console.log("upgrading");
        var db = e.target.result;
        for (var i = db.version - 1; i < migrations.length; i++) {
            console.log("running migration " + i);
            migration.call(this, db);
        }
        console.log("upgraded");
    };
    console.log('DHIS2 Chrome extension installed successfully.');
});