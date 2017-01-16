define(["properties", "platformUtils"], function(properties, platformUtils) {
    return function($hustle, $log, $q) {

        var checkHustleQueueCount = function() {
            return $q.all({
                count: $hustle.getCount('dataValues'),
                reservedCount: $hustle.getReservedCount()
            }).then(function (data) {
                platformUtils.sendMessage('syncQueueChange', data);
            });
        };

        var onSyncQueueChange = function(callback) {
            platformUtils.addListener('syncQueueChange', callback);
        };

        return {
            onSyncQueueChange: onSyncQueueChange,
            checkHustleQueueCount: checkHustleQueueCount
        };
    };
});
