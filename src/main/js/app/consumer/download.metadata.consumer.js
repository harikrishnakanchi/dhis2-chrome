define(["metadataConf"], function(metadataConf) {
    return function($q, metadataService, systemInfoService, metadataRepository, changeLogRepository) {
        var downloadStartTime, DHIS_VERSION;

        var getServerTime = function() {
            return systemInfoService.getServerDate().then(function (serverTime) {
                downloadStartTime = serverTime;
            });
        };

        var setDhisVersion = function () {
            return systemInfoService.getVersion().then(function (version) {
                DHIS_VERSION = version;
            });
        };

        var setSystemInfoDetails = function () {
            return getServerTime().then(setDhisVersion);
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
            return setSystemInfoDetails().then(function () {
                var entities = _.filter(metadataConf.entities, function (entity) {
                    return entity == 'translations' ? DHIS_VERSION == '2.23' : true;
                });
                return _.reduce(entities, function (res, entity) {
                    return res.then(function () {
                        return downloadAndUpsertEntity(entity);
                    });
                }, $q.when());
            });
        };
    };
});
