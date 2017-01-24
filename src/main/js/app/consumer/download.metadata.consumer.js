define(["moment"], function(moment) {
    return function(metadataService, systemInfoService, metadataRepository, changeLogRepository) {
        var downloadStartTime;

        var getServerTime = function() {
            return systemInfoService.getServerDate().then(function (serverTime) {
                downloadStartTime = serverTime;
            });
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert("metaData", downloadStartTime);
        };

        this.run = function () {
            return getServerTime().then
                (_.partial(changeLogRepository.get, 'metaData'))
                .then(metadataService.getMetadata)
                .then(metadataRepository.upsertMetadata)
                .then(updateChangeLog);
        };
    };
});
