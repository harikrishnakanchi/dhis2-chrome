define(["properties", "platformUtils"], function(properties, platformUtils) {
    return function($hustle, $log) {

        var checkHustleQueueCount = function() {
            return $hustle.getCount("dataValues").then(function(count) {
                return $hustle.getReservedCount().then(function(reservedCount) {
                    if (count > 0 || reservedCount > 0)
                        platformUtils.sendMessage("msgInSyncQueue");
                    else
                        platformUtils.sendMessage("noMsgInSyncQueue");
                });
            });
        };

        var setupAlarms = function () {
            $log.info("Registering checkHustleQueueCountAlarm");
            platformUtils.createAlarm('checkHustleQueueCountAlarm', {
                periodInMinutes: properties.queue.checkMsgcountDelayInMinutes
            });
            platformUtils.addAlarmListener("checkHustleQueueCountAlarm", checkHustleQueueCount);
        };

        var start = function() {
            setupAlarms();
            return checkHustleQueueCount();
        };

        var msgInSyncQueue = function(callback) {
            platformUtils.addListener("msgInSyncQueue", callback);
        };

        var noMsgInSyncQueue = function(callback) {
            platformUtils.addListener("noMsgInSyncQueue", callback);
        };

        return {
            "start": start,
            "msgInSyncQueue": msgInSyncQueue,
            "noMsgInSyncQueue": noMsgInSyncQueue
        };

    };
});
