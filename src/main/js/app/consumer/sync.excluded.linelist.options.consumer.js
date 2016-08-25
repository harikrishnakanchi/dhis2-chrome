define([], function () {
    return function ($q, excludedLineListOptionsRepository) {
        this.run = function (message) {
            var moduleId = message.data.data;
            if (moduleId) {
                return excludedLineListOptionsRepository.get(moduleId);
            }
            else {
                return $q.when();
            }
        };
    };
});