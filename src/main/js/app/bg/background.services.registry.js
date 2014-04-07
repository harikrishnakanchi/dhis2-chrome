define(["metadataSyncService"], function(metadataSyncService) {
    var register = function() {
        var registerCallback = function(alarmName, callback) {
            return function(alarm) {
                if (alarm.name === alarmName)
                    callback();
            };
        };

        if (chrome.alarms)
            chrome.alarms.onAlarm.addListener(registerCallback("metadataSyncAlarm", metadataSyncService.sync));
    };

    return {
        'register': register
    };
});