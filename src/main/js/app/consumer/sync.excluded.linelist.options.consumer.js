define(["lodash", "moment"], function (_, moment) {
    return function ($q, excludedLineListOptionsRepository, dataStoreService) {
        this.run = function (message) {
            var moduleId = message.data.data;
            if (!moduleId) {
                return $q.when();
            }
            return $q.all([excludedLineListOptionsRepository.get(moduleId), dataStoreService.getLastUpdatedTimeForExcludedOptions(moduleId)])
                .then(function (data) {
                    var localExcludedLineListOptions = data[0];
                    var lastUpdatedTimeOnLocal = moment(localExcludedLineListOptions.clientLastUpdated);
                    var lastUpdatedTimeOnRemote = data[1];
                    if (lastUpdatedTimeOnRemote) {
                        lastUpdatedTimeOnRemote = moment(lastUpdatedTimeOnRemote);
                        if (lastUpdatedTimeOnLocal.isAfter(lastUpdatedTimeOnRemote)) {
                            return dataStoreService.updateExcludedOptions(moduleId, localExcludedLineListOptions);
                        }
                        else {
                            return dataStoreService.getExcludedOptions(moduleId).then(excludedLineListOptionsRepository.upsert);
                        }
                    }
                    else {
                        return dataStoreService.createExcludedOptions(moduleId, localExcludedLineListOptions);
                    }
                });
        };
    };
});