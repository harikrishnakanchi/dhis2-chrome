define(["lodash", "moment"], function(_, moment) {
    return function($q, metadataService, systemSettingService, datasetService, programService, orgUnitService, changeLogRepository, metadataRepository, orgUnitRepository, orgUnitGroupRepository, datasetRepository, programRepository, systemSettingRepository) {
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

        var updateChangeLog = function(data) {
            var metadata = data[0];

            if (!_.isObject(metadata))
                return;

            var created = moment.utc(metadata.created).toISOString();
            var promises = [];
            promises.push(changeLogRepository.upsert("metaData", created));
            promises.push(changeLogRepository.upsert("orgUnits", created));
            promises.push(changeLogRepository.upsert("orgUnitGroups", created));
            promises.push(changeLogRepository.upsert("datasets", created));
            promises.push(changeLogRepository.upsert("programs", created));
            return $q.all(promises);
        };

        var importData = function(isNewInstall) {
            if (!isNewInstall)
                return;

            return $q.all([importMetadata(), importSystemSettings(), importDataSets(), importPrograms(), importOrgUnits()])
                .then(updateChangeLog);
        };

        var importMetadata = function() {
            return metadataService.loadMetadataFromFile().then(function(metadata) {
                if (!_.isObject(metadata))
                    return;
                var promises = [];
                promises.push(metadataRepository.upsertMetadata(metadata));
                promises.push(orgUnitGroupRepository.upsertDhisDownloadedData(metadata.organisationUnitGroups));
                return $q.all(promises).then(function() {
                    return metadata;
                });
            });
        };

        var importSystemSettings = function() {
            return systemSettingService.loadFromFile()
                .then(systemSettingRepository.upsert);
        };

        var importDataSets = function() {
            return datasetService.loadFromFile()
                .then(datasetRepository.upsertDhisDownloadedData);
        };

        var importPrograms = function() {
            return programService.loadFromFile()
                .then(programRepository.upsertDhisDownloadedData);
        };

        var importOrgUnits = function () {
            return orgUnitService.loadFromFile()
                .then(orgUnitRepository.upsertDhisDownloadedData);
        };
    };
});
