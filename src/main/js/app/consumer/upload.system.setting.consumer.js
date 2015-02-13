define([], function() {
    return function(systemSettingService, systemSettingRepository, $q) {
        var run = function(message) {
            var data = message.data.data;
            return systemSettingRepository.get(data.key).then(systemSettingService.upsert);
        };

        return {
            "run": run
        };
    };
});