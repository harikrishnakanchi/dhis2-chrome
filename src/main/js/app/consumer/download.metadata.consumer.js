define(["metadataConf"], function(metadataConf) {
    return function(metadataService, systemInfoService, metadataRepository, changeLogRepository) {
        var downloadStartTime;

        var getServerTime = function() {
            return systemInfoService.getServerDate().then(function (serverTime) {
                downloadStartTime = serverTime;
            });
        };

        var updateChangeLog = function(type) {
            return changeLogRepository.upsert(type, downloadStartTime);
        };

        var downloadAndUpsertEntity = function (type) {
            return changeLogRepository.get(type)
                .then(_.partial(metadataService.getMetadataOfType, type))
                .then(_.partial(metadataRepository.upsertMetadataForEntity, _, type))
                .then(_.partial(updateChangeLog, type));
        };

        this.run = function () {
            return _.reduce(metadataConf.types, function (res, val, key) {
                return res.then(function () {
                    return downloadAndUpsertEntity(key);
                });
            }, getServerTime());
        };
    };
});
