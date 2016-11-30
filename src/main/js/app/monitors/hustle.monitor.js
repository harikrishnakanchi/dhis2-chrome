define(["properties", "platformUtils"], function(properties, platformUtils) {
    return function($hustle, $log, $q) {

        var checkHustleQueueCount = function() {
            return $q.all({
                count: $hustle.getCount('dataValues'),
                reservedCount: $hustle.getReservedCount()
            }).then(function (data) {
                var message = (data.count > 0 || data.reservedCount > 0) ? 'msgInSyncQueue' : 'noMsgInSyncQueue';
                platformUtils.sendMessage(message);
            });
        };

        var msgInSyncQueue = function(callback) {
            platformUtils.addListener("msgInSyncQueue", callback);
        };

        var noMsgInSyncQueue = function(callback) {
            platformUtils.addListener("noMsgInSyncQueue", callback);
        };

        return {
            msgInSyncQueue: msgInSyncQueue,
            noMsgInSyncQueue: noMsgInSyncQueue,
            checkHustleQueueCount: checkHustleQueueCount
        };
    };
});
