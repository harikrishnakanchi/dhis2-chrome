define(["lodash"], function (_) {
    return function ($q, excludedLineListOptionsRepository, dataStoreService) {
        this.run = function (message) {
            var moduleId = message.data.data;
            if (!moduleId) {
                return $q.when();
            }
            return excludedLineListOptionsRepository.get(moduleId)
                .then(_.partial(dataStoreService.updateExcludedOptions, moduleId));
        };
    };
});