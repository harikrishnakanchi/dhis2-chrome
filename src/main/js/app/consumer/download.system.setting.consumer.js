define(['moment', 'lodashUtils'], function(moment, _) {
    return function(systemSettingService, systemSettingRepository, mergeBy) {
        var run = function(message) {
            return download().then(mergeAndSave);
        };

        var download = function() {
            return systemSettingService.getAll();
        };

        var filterOutModuleTemplates = function(settings) {
            return _.filter(settings, function(setting) {
                return setting.key !== "moduleTemplates";
            });
        };

        var mergeAndSave = function(remoteSettings) {
            var remoteSettingKeys = _.map(remoteSettings, function(remoteSetting) {
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

            return systemSettingRepository.findAll(remoteSettingKeys).then(function(localSettings) {
                var remoteSettingsToBeMerged = filterOutModuleTemplates(remoteSettings);
                var localSettingsToBeMerged = filterOutModuleTemplates(localSettings);

                var mergedSettings = mergeBy.lastUpdated(mergeOpts, remoteSettingsToBeMerged, localSettingsToBeMerged);
                return systemSettingRepository.upsert(mergedSettings.concat(_.find(remoteSettings, {
                    "key": "moduleTemplates"
                })));
            });

        };

        return {
            "run": run
        };
    };
});
