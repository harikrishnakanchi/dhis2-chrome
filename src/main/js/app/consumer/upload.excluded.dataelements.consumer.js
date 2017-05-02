define(["lodash", "moment"], function(_, moment) {
    return function($q, dataStoreService, excludedDataElementsRepository) {
        this.run = function(message) {
            var moduleId = message.data.data;
            return $q.all({
                remoteExcludedDataElements: dataStoreService.getExcludedDataElements([moduleId]),
                localExcludedDataElements: excludedDataElementsRepository.get(moduleId)
            }).then(function (data) {
                var remoteExcludedDataElements = _.first(data.remoteExcludedDataElements);
                if (!remoteExcludedDataElements) {
                    return dataStoreService.createExcludedDataElements(moduleId, data.localExcludedDataElements);
                } else {
                    var epoch = '1970-01-01',
                        localTime = moment(_.get(data, 'localExcludedDataElements.clientLastUpdated', epoch)),
                        remoteTime = moment(_.get(remoteExcludedDataElements, 'clientLastUpdated'));

                    return localTime.isAfter(remoteTime) ?
                        dataStoreService.updateExcludedDataElements(moduleId, data.localExcludedDataElements) :
                        excludedDataElementsRepository.upsert(remoteExcludedDataElements);
                }
            });
        };
    };
});
