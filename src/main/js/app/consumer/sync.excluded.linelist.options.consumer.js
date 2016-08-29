define([], function () {
    return function ($q, excludedLinelistOptionsMerger) {
        this.run = function (message) {
            var moduleId = message.data.data;
            if (!moduleId) {
                return $q.when();
            }
            return excludedLinelistOptionsMerger.mergeAndSync(moduleId);
        };
    };
});