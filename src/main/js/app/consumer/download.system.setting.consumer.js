define(['moment', 'lodashUtils', 'mergeBy'], function(moment, _, mergeBy) {
    return function(systemSettingService, systemSettingRepository, changeLogRepository, $q) {
        this.run = function(message) {
            return download().then(mergeAndSave);
        };

        var download = function() {
            return systemSettingService.getAll();
        };

        var mergeAndSave = function(remoteSettings) {
            var moduleIds = _.keys(remoteSettings);
            var eq = function(item1, item2) {
                return item1.key === item2.key;
            };
            var mergeOpts = {
                eq: eq,
                remoteTimeField: "value.clientLastUpdated",
                localTimeField: "value.clientLastUpdated"
            };
            return systemSettingRepository.findAll(moduleIds)
                .then(_.curry(mergeBy.lastUpdated)(mergeOpts, remoteSettings))
                .then(systemSettingRepository.upsertDhisDownloadedData);
        };
    };
});