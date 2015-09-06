define([], function() {
    return function(systemSettingService, systemSettingRepository) {
        this.run = function(message) {
            return systemSettingService.getSystemSettings()
                .then(systemSettingRepository.upsert);
        };
    };
});
