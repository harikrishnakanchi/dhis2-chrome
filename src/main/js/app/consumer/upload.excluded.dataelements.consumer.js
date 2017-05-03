define(["lodash", "moment"], function(_, moment) {
    return function($q, dataStoreService, excludedDataElementsRepository, orgUnitRepository) {
        this.run = function(message) {
            var moduleId = message.data.data;
            var getParentProjectPromise = orgUnitRepository.getParentProject(moduleId).then(_.property('id'));
            return $q.all({
                remoteExcludedDataElements: getParentProjectPromise.then(_.partialRight(dataStoreService.getExcludedDataElements, moduleId)),
                localExcludedDataElements: excludedDataElementsRepository.get(moduleId),
                projectId: getParentProjectPromise
            }).then(function (data) {
                var projectId = data.projectId;
                var remoteExcludedDataElements = data.remoteExcludedDataElements;
                if (!remoteExcludedDataElements) {
                    return dataStoreService.createExcludedDataElements(projectId, moduleId, data.localExcludedDataElements);
                } else {
                    var epoch = '1970-01-01',
                        localTime = moment(_.get(data, 'localExcludedDataElements.clientLastUpdated', epoch)),
                        remoteTime = moment(_.get(remoteExcludedDataElements, 'clientLastUpdated'));

                    return localTime.isAfter(remoteTime) ?
                        dataStoreService.updateExcludedDataElements(projectId, moduleId, data.localExcludedDataElements) :
                        excludedDataElementsRepository.upsert(remoteExcludedDataElements);
                }
            });
        };
    };
});
