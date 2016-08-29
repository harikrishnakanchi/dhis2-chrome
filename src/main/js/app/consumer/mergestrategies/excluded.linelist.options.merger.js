define(['moment'], function (moment) {
    return function ($q, excludedLineListOptionsRepository, dataStoreService) {
        this.mergeAndSync = function (moduleId) {
            if (!moduleId) {
                return $q.when();
            }
            return $q.all([excludedLineListOptionsRepository.get(moduleId), dataStoreService.getExcludedOptions(moduleId)])
                .then(function (data) {
                    var localExcludedLineListOptions = data[0];
                    var remoteExcludedLineListOptions = data[1];
                    var lastUpdatedTimeOnLocal = localExcludedLineListOptions && localExcludedLineListOptions.clientLastUpdated;
                    var lastUpdatedTimeOnRemote = remoteExcludedLineListOptions && remoteExcludedLineListOptions.clientLastUpdated;
                    if (lastUpdatedTimeOnRemote && lastUpdatedTimeOnLocal) {
                        lastUpdatedTimeOnRemote = moment(lastUpdatedTimeOnRemote);
                        lastUpdatedTimeOnLocal = moment(lastUpdatedTimeOnLocal);
                        if (lastUpdatedTimeOnLocal.isAfter(lastUpdatedTimeOnRemote)) {
                            return dataStoreService.updateExcludedOptions(moduleId, localExcludedLineListOptions);
                        }
                        else if (lastUpdatedTimeOnLocal.isSame(lastUpdatedTimeOnRemote)) {
                            return $q.when();
                        }
                        else {
                            return excludedLineListOptionsRepository.upsert(remoteExcludedLineListOptions);
                        }
                    }
                    else {
                        return dataStoreService.createExcludedOptions(moduleId, localExcludedLineListOptions);
                    }
                });
        };
    };
});