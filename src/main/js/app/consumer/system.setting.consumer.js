define([], function() {
    return function(systemSettingService) {
        this.run = function(message) {
            console.debug("Adding excluded data elements to system settings: ", message.data.data);
            return systemSettingService.excludeDataElements(message.data.data);
        };
    };
});