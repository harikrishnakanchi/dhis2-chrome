define([], function () {
    return function ($q, changeLogRepository) {
        this.checkMetadata = function () {
            return changeLogRepository.get('metaData').then(function (lastUpdated) {
                return lastUpdated ? $q.when(): $q.reject('noMetadata');
            });
        };
    };
});