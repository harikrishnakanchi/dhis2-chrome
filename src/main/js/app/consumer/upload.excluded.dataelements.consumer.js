define(["lodash"], function(_) {
    return function($q, systemSettingService, excludedDataElementsRepository, orgUnitRepository) {
        this.run = function(message) {
            var moduleId = message.data.data;
            var getParentProjectPromise = orgUnitRepository.getParentProject(moduleId);
            var getExcludedDataElementsPromise = excludedDataElementsRepository.get(moduleId);
            return $q.all([getParentProjectPromise, getExcludedDataElementsPromise]).then(function(data) {
                var projectId = data[0].id;
                var updatedExcludedDataElements = data[1];
                return systemSettingService.upsertExcludedDataElements(projectId, updatedExcludedDataElements);
            });
        };
    };
});
