define(['moment'], function (moment) {
    return function ($q, excludedLineListOptionsRepository, dataStoreService, orgUnitRepository) {
        var self = this;

        self.mergeAndSync = function (moduleId) {
            if (!moduleId) {
                return $q.when();
            }
            var getParentProjectPromise = orgUnitRepository.getParentProject(moduleId).then(_.property('id'));
            return $q.all([excludedLineListOptionsRepository.get(moduleId), getParentProjectPromise.then(_.partialRight(dataStoreService.getExcludedOptions, moduleId)), getParentProjectPromise])
                .then(function (data) {
                    var localExcludedLineListOptions = data[0];
                    var remoteExcludedLineListOptions = data[1];
                    var projectId = data[2];
                    var lastUpdatedTimeOnLocal = localExcludedLineListOptions && localExcludedLineListOptions.clientLastUpdated;
                    var lastUpdatedTimeOnRemote = remoteExcludedLineListOptions && remoteExcludedLineListOptions.clientLastUpdated;
                    if (lastUpdatedTimeOnRemote && lastUpdatedTimeOnLocal) {
                        lastUpdatedTimeOnRemote = moment.utc(lastUpdatedTimeOnRemote);
                        lastUpdatedTimeOnLocal = moment.utc(lastUpdatedTimeOnLocal);
                        if (lastUpdatedTimeOnLocal.isAfter(lastUpdatedTimeOnRemote)) {
                            return dataStoreService.updateExcludedOptions(projectId, moduleId, localExcludedLineListOptions);
                        }
                        else if (lastUpdatedTimeOnLocal.isSame(lastUpdatedTimeOnRemote)) {
                            return $q.when();
                        }
                        else {
                            return excludedLineListOptionsRepository.upsert(remoteExcludedLineListOptions);
                        }
                    }
                    else if (!lastUpdatedTimeOnRemote) {
                        return dataStoreService.createExcludedOptions(projectId, moduleId, localExcludedLineListOptions);
                    }
                    else {
                        return excludedLineListOptionsRepository.upsert(remoteExcludedLineListOptions);
                    }
                });
        };
    };
});