define([], function() {
    return function(systemSettingService) {
        this.run = function(message) {
            return systemSettingService.excludeDataElements(message.data.data);
        };
    };
});
