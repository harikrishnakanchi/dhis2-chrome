define(["moment"], function(moment) {
    return function(metadataService, metadataRepository, changeLogRepository) {

        var updateChangeLog = function() {
            return changeLogRepository.upsert("metaData", moment().toISOString());
        };

        this.run = function() {
            return changeLogRepository.get("metaData")
                .then(metadataService.getMetadata)
                .then(metadataRepository.upsertMetadata)
                .then(updateChangeLog);
        };
    };
});
