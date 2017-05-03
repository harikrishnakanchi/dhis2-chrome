define(['moment'], function (moment) {
    return function ($q, excludedLineListOptionsRepository, dataStoreService, orgUnitRepository) {
        var self = this;

        var mergeAndSync = function (moduleId, upstreamSync) {
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
                            return upstreamSync ? dataStoreService.updateExcludedOptions(projectId, moduleId, localExcludedLineListOptions) : $q.when();
                        }
                        else if (lastUpdatedTimeOnLocal.isSame(lastUpdatedTimeOnRemote)) {
                            return $q.when();
                        }
                        else {
                            return excludedLineListOptionsRepository.upsert(remoteExcludedLineListOptions);
                        }
                    }
                    else if (!lastUpdatedTimeOnRemote && upstreamSync) {
                        return dataStoreService.createExcludedOptions(projectId, moduleId, localExcludedLineListOptions);
                    }
                    else {
                        return excludedLineListOptionsRepository.upsert(remoteExcludedLineListOptions);
                    }
                });
        };

        self.mergeAndSync = _.partial(mergeAndSync, _, true);

        self.mergeAndSaveForProject = function (projectId) {
            return $q.all({
                moduleIds: orgUnitRepository.getAllModulesInOrgUnits(projectId),
                remoteKeys: dataStoreService.getKeysForExcludedOptions(projectId)
            }).then(function (data) {
                var moduleIds = _.map(data.moduleIds, 'id'),
                    remoteKeys = _.map(data.remoteKeys, function (key) {
                        return _.first(key.split('_'));
                    });

                var moduleIdsToBeMerged = _.intersection(moduleIds, remoteKeys);
                return _.reduce(moduleIdsToBeMerged, function (promise, moduleId) {
                    return promise.then(_.partial(mergeAndSync, moduleId, false));
                }, $q.when());
            });
        };
    };
});