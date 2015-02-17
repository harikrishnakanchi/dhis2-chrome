define([], function() {
    return function($q, metadataService, systemSettingService, systemSettingRepository, changeLogRepository, metadataRepository, orgUnitRepository, orgUnitGroupRepository, datasetRepository, programRepository) {
        this.run = function() {
            return verifyIsNewInstall().then(importData);
        };

        var verifyIsNewInstall = function() {
            return changeLogRepository.get("metaData").then(function(metadataLastUpdated) {
                if (!metadataLastUpdated)
                    return true;
                return false;
            });
        };

        var importData = function(isNewInstall) {
            if (!isNewInstall)
                return;

            return $q.all([importMetadata(), importSystemSettings()]).then(function(data) {
                var metadata = data[0];
                return changeLogRepository.upsert("metaData", metadata.created);
            });
        };

        var importMetadata = function() {
            return metadataService.loadMetadataFromFile().then(function(metadata) {
                var promises = [];
                promises.push(metadataRepository.upsertMetadata(metadata));
                promises.push(orgUnitRepository.upsertDhisDownloadedData(metadata.organisationUnits));
                promises.push(orgUnitGroupRepository.upsertDhisDownloadedData(metadata.organisationUnitGroups));
                promises.push(datasetRepository.upsertDhisDownloadedData(metadata.dataSets));
                promises.push(programRepository.upsertDhisDownloadedData(metadata.programs));
                return $q.all(promises).then(function() {
                    return metadata;
                });
            });
        };

        var importSystemSettings = function(isNewInstall) {
            return systemSettingService.loadFromFile().then(systemSettingRepository.upsert);
        };
    };
});