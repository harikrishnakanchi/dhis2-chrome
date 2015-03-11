define(['moment', 'lodashUtils'], function(moment, _) {
    return function(systemSettingService, systemSettingRepository, mergeBy) {
        var run = function(message) {
            return download().then(mergeAndSave);
        };

        var download = function() {
            return systemSettingService.getAll();
        };

        var mergeAndSave = function(remoteSettings) {
            var moduleIds = _.map(remoteSettings, function(remoteSetting) {
                return remoteSetting.key;
            });
            var eq = function(item1, item2) {
                return item1.key && item1.key === item2.key;
            };

            var mergeOpts = {
                eq: eq,
                remoteTimeField: "value.clientLastUpdated",
                localTimeField: "value.clientLastUpdated"
            };
            return systemSettingRepository.findAll(moduleIds)
                .then(_.curry(mergeBy.lastUpdated)(mergeOpts, remoteSettings))
                .then(systemSettingRepository.upsert);
        };

        return {
            "run": run
        };
    };
});
