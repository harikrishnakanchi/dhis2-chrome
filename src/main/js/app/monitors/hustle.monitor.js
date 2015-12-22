define(["properties", "chromeUtils"], function(properties, chromeUtils) {
    return function($hustle, $log) {

        var checkHustleQueueCount = function() {
            return $hustle.getCount("dataValues").then(function(count) {
                return $hustle.getReservedCount().then(function(reservedCount) {
                    if (count > 0 || reservedCount > 0)
                        chromeUtils.sendMessage("msgInSyncQueue");
                    else
                        chromeUtils.sendMessage("noMsgInSyncQueue");
                });
            });
        };

        var registerCallback = function(alarmName, callback) {
            return function(alarm) {
                if (alarm.name === alarmName)
                    callback();
            };
        };

        var setupAlarms = function() {
            if (chrome.alarms) {
                $log.info("Registering checkHustleQueueCountAlarm");
                chrome.alarms.create('checkHustleQueueCountAlarm', {
                    periodInMinutes: properties.queue.checkMsgcountDelayInMinutes
                });
                chrome.alarms.onAlarm.addListener(registerCallback("checkHustleQueueCountAlarm", checkHustleQueueCount));
            }
        };

        var start = function() {
            setupAlarms();
            return checkHustleQueueCount();
        };

        var msgInSyncQueue = function(callback) {
            chromeUtils.addListener("msgInSyncQueue", callback);
        };

        var noMsgInSyncQueue = function(callback) {
            chromeUtils.addListener("noMsgInSyncQueue", callback);
        };

        return {
            "start": start,
            "msgInSyncQueue": msgInSyncQueue,
            "noMsgInSyncQueue": noMsgInSyncQueue
        };

    };
});
