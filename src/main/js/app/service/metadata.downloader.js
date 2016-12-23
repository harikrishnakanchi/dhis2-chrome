define(['dhisUrl', 'moment', 'properties', 'lodash'], function (dhisUrl, moment, properties, _) {
    return function ($http, $q, changeLogRepository, metadataRepository, orgUnitGroupRepository, dataSetRepository, programRepository, systemSettingRepository, orgUnitRepository) {

        var TEMP_CHANGE_LOG_PREFIX = 'temp:';

        var entities = [{
            name: 'metadata',
            url: dhisUrl.metadata,
            params: {
                assumeTrue: false,
                categories: true,
                categoryCombos: true,
                categoryOptionCombos: true,
                categoryOptions: true,
                dataElementGroups: true,
                dataElements: true,
                optionSets: true,
                organisationUnitGroupSets: true,
                sections: true,
                translations: true,
                users: true,
                organisationUnitGroups: true
            },
            upsertFn: function (response) {
                var metadata = response.data;
                if (!_.isObject(metadata)) return;
                return $q.all([
                    metadataRepository.upsertMetadata(metadata),
                    orgUnitGroupRepository.upsertDhisDownloadedData(metadata.organisationUnitGroups)
                ]);
            }
        }, {
            name: 'dataSets',
            url: dhisUrl.dataSets,
            params: {
                fields: ':all,attributeValues[:identifiable,value,attribute[:identifiable]],!organisationUnits&paging=false'
            },
            upsertFn: function (response) {
                var datasets = response.data.dataSets;
                return dataSetRepository.upsertDhisDownloadedData(datasets);
            }
        }, {
            name: 'programs',
            url: dhisUrl.programs,
            params: {
                fields: 'id,name,displayName,organisationUnits,attributeValues[:identifiable,value,attribute[:identifiable]],programType,programStages[id,name,programStageSections[id,name,programStageDataElements[id,compulsory,dataElement[id,name]]]]',
                paging: false
            },
            upsertFn: function (response) {
                var programs = response.data.programs;
                return programRepository.upsertDhisDownloadedData(programs);
            }
        }, {
            name: 'systemSettings',
            url: dhisUrl.systemSettings,
            params: {
                key: 'fieldAppSettings,versionCompatibilityInfo',
            },
            upsertFn: function (response) {
                var systemSettingsData = response.data;
                var accumulator = [];
                _.each(systemSettingsData, function (fieldAppSetting) {
                    _.transform(fieldAppSetting, function (acc, value, key) {
                        acc.push({
                            "key": key,
                            "value": value
                        });
                    }, []);
                });
                return systemSettingRepository.upsert(accumulator);
            }
        }, {
            name: 'orgUnits',
            url: dhisUrl.orgUnits,
            params: {
                fields: ':all,parent[:identifiable],attributeValues[:identifiable,value,attribute[:identifiable]],dataSets,!access,!href,!uuid',
                paging: false
            },
            upsertFn: function (response) {
                var orgUnits = response.data.organisationUnits;
                return orgUnitRepository.upsertDhisDownloadedData(orgUnits);
            }
        }];

        var getChangeLog = function (entity) {
            return changeLogRepository.get(TEMP_CHANGE_LOG_PREFIX + entity).then(function (lastUpdated) {
                return !!lastUpdated;
            });
        };

        var downloadAndUpsert = function (url, params, upsertFn) {
            return $http.get(url, {params: params}).then(upsertFn);
        };

        var upsertChangeLog = function (entity) {
            return changeLogRepository.upsert(TEMP_CHANGE_LOG_PREFIX + entity, moment().toISOString());
        };

        var downloadEntityIfNotExists = function (entity) {
            return getChangeLog(entity.name).then(function (lastUpdated) {
                return lastUpdated ? $q.when() : downloadAndUpsert(entity.url, entity.params, entity.upsertFn).then(_.partial(upsertChangeLog, entity.name));
            });

        };

        this.run = function () {
            var deferred = $q.defer();

            _.reduce(entities, function (promise, entity, index) {
                return promise.then(function () {
                    return downloadEntityIfNotExists(entity).then(function () {
                        deferred.notify({percent: ((index + 1) / entities.length) * 100});
                    });
                });
            }, $q.when())
                .then(_.partial(changeLogRepository.clear, TEMP_CHANGE_LOG_PREFIX))
                .then(deferred.resolve)
                .catch(deferred.reject);

            return deferred.promise;
        };
    };
});
