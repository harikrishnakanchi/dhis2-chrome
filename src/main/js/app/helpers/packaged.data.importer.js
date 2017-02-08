define(["lodash", "moment", "metadataConf"], function(_, moment, metadataConf) {
    return function($q, metadataService, systemSettingService, datasetService, programService, orgUnitService, changeLogRepository, metadataRepository, orgUnitRepository, orgUnitGroupRepository, datasetRepository, programRepository, systemSettingRepository) {
        this.run = function() {
            return verifyIsNewInstall().then(importData);
        };

        var verifyIsNewInstall = function() {
            return changeLogRepository.get("metaData").then(function(metadataLastUpdated) {
                return !metadataLastUpdated;
            });
        };

        var updateChangeLog = function(data) {
            var metadata = data[0];

            if (!_.isObject(metadata))
                return;

            // TODO: Remove 'metadata.created' backwards compatibility code after upgrading to DHIS 2.25
            var created = moment.utc(metadata.created || metadata.system.date).toISOString();

            var entities = [
                'metaData',
                'organisationUnits',
                'organisationUnitGroups',
                'dataSets',
                'programs'
            ];

            entities = entities.concat(metadataConf.entities);
            return $q.all(_.map(entities, _.partial(changeLogRepository.upsert, _, created)));
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
