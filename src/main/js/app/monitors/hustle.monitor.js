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

        var setupAlarms = function () {
            $log.info("Registering checkHustleQueueCountAlarm");
            chromeUtils.createAlarm('checkHustleQueueCountAlarm', {
                periodInMinutes: properties.queue.checkMsgcountDelayInMinutes
            });
            chromeUtils.addAlarmListener("checkHustleQueueCountAlarm", checkHustleQueueCount);
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
