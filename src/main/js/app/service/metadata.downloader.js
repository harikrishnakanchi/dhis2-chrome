define(['dhisUrl', 'moment', 'properties', 'lodash', 'pagingUtils', 'metadataConf'], function (dhisUrl, moment, properties, _, pagingUtils, metadataConf) {
    return function ($http, $q, changeLogRepository, metadataRepository, orgUnitGroupRepository, dataSetRepository, programRepository,
                     systemSettingRepository, orgUnitRepository, userRepository, systemInfoService) {

        var MAX_PAGE_REQUESTS = 500, updated, DHIS_VERSION;

        var getChangeLog = function (entity) {
            return changeLogRepository.get(entity);
        };

        var downloadAndUpsert = function (entity) {
            var upsertFn = entity.upsertFn || function () {};

            var downloadWithPagination = function (queryParams) {
                return $http.get(entity.url, { params: queryParams }).then(function(response) {
                    return {
                        pager: response.data.pager,
                        data: response.data[entity.name]
                    };
                });
            };

            var downloadWithoutPagination = function (entity) {
                return $http.get(entity.url, { params: entity.params}).then(_.property('data'));
            };

            return (entity.skipPaging ? downloadWithoutPagination(entity) : pagingUtils.paginateRequest(downloadWithPagination, entity.params, MAX_PAGE_REQUESTS, []))
                .then(upsertFn);
        };

        var updateChangeLog = function (entity) {
            return changeLogRepository.upsert(entity, updated);
        };

        var downloadEntityIfNotExists = function (entity) {
            return getChangeLog(entity.name).then(function (lastUpdated) {
                return lastUpdated ? $q.when() : downloadAndUpsert(entity).then(_.partial(updateChangeLog, entity.name));
            });
        };

        this.run = function () {

            var entities = [{
                name: 'categories',
                url: dhisUrl.categories,
                params: {
                    fields: metadataConf.fields.categories
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'categories');
                }
            }, {
                name: 'categoryCombos',
                url: dhisUrl.categoryCombos,
                params: {
                    fields: metadataConf.fields.categoryCombos
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'categoryCombos');
                }
            }, {
                name: 'categoryOptionCombos',
                url: dhisUrl.categoryOptionCombos,
                params: {
                    fields: metadataConf.fields.categoryOptionCombos,
                    pageSize: 200   // PageSize of 50 : ~12KB
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'categoryOptionCombos');
                }
            }, {
                name: 'categoryOptions',
                url: dhisUrl.categoryOptions,
                params: {
                    fields: metadataConf.fields.categoryOptions,
                    pageSize: 200   // PageSize of 50 : ~12KB
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'categoryOptions');
                }
            }, {
                name: 'dataElementGroups',
                url: dhisUrl.dataElementGroups,
                params: {
                    fields: metadataConf.fields.dataElementGroups
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'dataElementGroups');
                }
            }, {
                name: 'dataElements',
                url: dhisUrl.dataElements,
                params: {
                    fields: metadataConf.fields.dataElements,
                    pageSize: 100   // PageSize of 50 : ~12KB
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'dataElements');
                }
            }, {
                name: 'indicators',
                url: dhisUrl.indicators,
                params: {
                    fields: metadataConf.fields.indicators,
                    pageSize: 100   // PageSize of 50 : ~8KB
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'indicators');
                }
            }, {
                name: 'programIndicators',
                url: dhisUrl.programIndicators,
                params: {
                    fields: metadataConf.fields.programIndicators,
                    pageSize: 100   // PageSize of 50 : ~6KB
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'programIndicators');
                }
            }, {
                name: 'optionSets',
                url: dhisUrl.optionSets,
                params: {
                    fields: metadataConf.fields.optionSets
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'optionSets');
                }
            }, {
                name: 'organisationUnitGroupSets',
                url: dhisUrl.organisationUnitGroupSets,
                params: {
                    fields: metadataConf.fields.organisationUnitGroupSets
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'organisationUnitGroupSets');
                }
            }, {
                name: 'sections',
                url: dhisUrl.sections,
                params: {
                    fields: metadataConf.fields.sections,
                    pageSize: 150   // PageSize of 50 : ~8KB
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'sections');
                }
            }, {
                name: 'users',
                url: dhisUrl.users,
                params: {
                    fields: metadataConf.fields.users,
                    pageSize: 25    // PageSize of 50 : ~50KB
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'users');
                }
            }, {
                name: 'userRoles',
                url: dhisUrl.userRoles,
                params: {
                    fields: metadataConf.fields.userRoles
                },
                upsertFn: function (response) {
                    return userRepository.upsertUserRoles(response);
                }
            }, {
                name: 'organisationUnitGroups',
                url: dhisUrl.organisationUnitGroups,
                params: {
                    fields: metadataConf.fields.organisationUnitGroups
                },
                upsertFn: function (response) {
                    return orgUnitGroupRepository.upsertDhisDownloadedData(response);
                }
            }, {
                name: 'dataSets',
                url: dhisUrl.dataSets,
                params: {
                    fields: metadataConf.fields.dataSets
                },
                upsertFn: function (response) {
                    return dataSetRepository.upsertDhisDownloadedData(response);
                }
            }, {
                name: 'programs',
                url: dhisUrl.programs,
                params: {
                    fields: metadataConf.fields.programs
                },
                upsertFn: function (response) {
                    return programRepository.upsertDhisDownloadedData(response);
                }
            }, {
                name: 'organisationUnits',
                url: dhisUrl.orgUnits,
                params: {
                    fields: metadataConf.fields.organisationUnits,
                    pageSize: 150   //PageSize of 50 : ~ 9KB-10KB
                },
                upsertFn: function(response) {
                    return orgUnitRepository.upsertDhisDownloadedData(response);
                }
            }, {
                name: 'systemSettings',
                url: dhisUrl.systemSettings,
                params: {
                    key: 'fieldAppSettings,versionCompatibilityInfo,notificationSetting'
                },
                skipPaging: true,
                upsertFn: function (response) {
                    var accumulator = [];
                    _.each(response, function (systemSetting) {
                        _.each(systemSetting, function (value, key) {
                            accumulator.push({ key: key, value: value });
                        });
                    });
                    return systemSettingRepository.upsert(accumulator);
                }
            }, {
                name: 'attributes',
                url: dhisUrl.attributes,
                params: {
                    fields: metadataConf.fields.attributes
                },
                upsertFn: function (attributes) {
                    return metadataRepository.upsertMetadataForEntity(attributes, 'attributes');
                }
            }, {
                name: 'translations',
                url: dhisUrl.translations,
                params: {
                    fields: metadataConf.fields.translations,
                    pageSize: 300   //PageSize of 50 : ~2KB - 3KB
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'translations');
                }
            }];

            var deferred = $q.defer();

            var setDownloadStartTime = function () {
                return systemInfoService.getServerDate().then(function(serverDate) {
                    updated = serverDate;
                });
            };

            var setDhisVersion = function () {
                return systemInfoService.getVersion().then(function (version) {
                    DHIS_VERSION = version;
                });
            };

            var setSystemInfoDetails = function () {
                return setDownloadStartTime().then(setDhisVersion);
            };

            var updateMetadataChangeLog = function () {
                return changeLogRepository.upsert('metaData', updated);
            };

            _.reduce(entities, function (promise, entity, index) {
                return promise.then(function () {
                    var downloadPromise = (entity.name == 'translations' && DHIS_VERSION != '2.23') ? $q.when() : downloadEntityIfNotExists(entity);
                    return downloadPromise.then(function () {
                        deferred.notify({percent: _.floor(((index + 1) / entities.length) * 100)});
                    });
                });
            }, setSystemInfoDetails())
                .then(updateMetadataChangeLog)
                .then(deferred.resolve)
                .catch(function (response) {
                    var data = response.status == 401 ? "productKeyExpired" : "downloadFailed";
                    deferred.reject(data);
                });

            return deferred.promise;
        };
    };
});
