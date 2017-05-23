define(['dhisUrl', 'moment', 'properties', 'lodash', 'pagingUtils', 'metadataConf', 'constants'], function (dhisUrl, moment, properties, _, pagingUtils, metadataConf, constants) {
    return function ($http, $q, changeLogRepository, metadataRepository, orgUnitGroupRepository, dataSetRepository, programRepository,
                     systemSettingRepository, orgUnitRepository, userRepository, systemInfoService, orgUnitService) {

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

            return (entity.params.paging ? pagingUtils.paginateRequest(downloadWithPagination, entity.params, MAX_PAGE_REQUESTS, []) : downloadWithoutPagination(entity))
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
                    fields: metadataConf.fields.categories.params,
                    paging: metadataConf.fields.categories.paging
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'categories');
                }
            }, {
                name: 'categoryCombos',
                url: dhisUrl.categoryCombos,
                params: {
                    fields: metadataConf.fields.categoryCombos.params,
                    paging: metadataConf.fields.categoryCombos.paging
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'categoryCombos');
                }
            }, {
                name: 'categoryOptionCombos',
                url: dhisUrl.categoryOptionCombos,
                params: {
                    fields: metadataConf.fields.categoryOptionCombos.params,
                    paging: metadataConf.fields.categoryOptionCombos.paging,
                    pageSize: metadataConf.fields.categoryOptionCombos.pageSize
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'categoryOptionCombos');
                }
            }, {
                name: 'categoryOptions',
                url: dhisUrl.categoryOptions,
                params: {
                    fields: metadataConf.fields.categoryOptions.params,
                    paging: metadataConf.fields.categoryOptions.paging,
                    pageSize: metadataConf.fields.categoryOptions.pageSize
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'categoryOptions');
                }
            }, {
                name: 'dataElementGroups',
                url: dhisUrl.dataElementGroups,
                params: {
                    fields: metadataConf.fields.dataElementGroups.params,
                    paging: metadataConf.fields.dataElementGroups.paging
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'dataElementGroups');
                }
            }, {
                name: 'dataElements',
                url: dhisUrl.dataElements,
                params: {
                    fields: metadataConf.fields.dataElements.params,
                    paging: metadataConf.fields.dataElements.paging,
                    pageSize: metadataConf.fields.dataElements.pageSize
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'dataElements');
                }
            }, {
                name: 'indicators',
                url: dhisUrl.indicators,
                params: {
                    fields: metadataConf.fields.indicators.params,
                    paging: metadataConf.fields.indicators.paging,
                    pageSize: metadataConf.fields.indicators.pageSize
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'indicators');
                }
            }, {
                name: 'programIndicators',
                url: dhisUrl.programIndicators,
                params: {
                    fields: metadataConf.fields.programIndicators.params,
                    paging: metadataConf.fields.programIndicators.paging,
                    pageSize: metadataConf.fields.programIndicators.pageSize
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'programIndicators');
                }
            }, {
                name: 'optionSets',
                url: dhisUrl.optionSets,
                params: {
                    fields: metadataConf.fields.optionSets.params,
                    paging: metadataConf.fields.optionSets.paging
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'optionSets');
                }
            }, {
                name: 'options',
                url: dhisUrl.options,
                params: {
                    fields: metadataConf.fields.options.params,
                    paging: metadataConf.fields.options.paging,
                    pageSize: metadataConf.fields.options.pageSize
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'options');
                }
            }, {
                name: 'organisationUnitGroupSets',
                url: dhisUrl.organisationUnitGroupSets,
                params: {
                    fields: metadataConf.fields.organisationUnitGroupSets.params,
                    paging: metadataConf.fields.organisationUnitGroupSets.paging
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'organisationUnitGroupSets');
                }
            }, {
                name: 'sections',
                url: dhisUrl.sections,
                params: {
                    fields: metadataConf.fields.sections.params,
                    paging: metadataConf.fields.sections.paging,
                    pageSize: metadataConf.fields.sections.pageSize
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'sections');
                }
            }, {
                name: 'users',
                url: dhisUrl.users,
                params: {
                    fields: metadataConf.fields.users.params,
                    paging: metadataConf.fields.users.paging,
                    pageSize: metadataConf.fields.users.pageSize
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'users');
                }
            }, {
                name: 'userRoles',
                url: dhisUrl.userRoles,
                params: {
                    fields: metadataConf.fields.userRoles.params,
                    paging: metadataConf.fields.userRoles.paging
                },
                upsertFn: function (response) {
                    return userRepository.upsertUserRoles(response);
                }
            }, {
                name: 'organisationUnitGroups',
                url: dhisUrl.organisationUnitGroups,
                params: {
                    fields: metadataConf.fields.organisationUnitGroups.params,
                    paging: metadataConf.fields.organisationUnitGroups.paging
                },
                upsertFn: function (response) {
                    return orgUnitGroupRepository.upsertDhisDownloadedData(response);
                }
            }, {
                name: 'dataSets',
                url: dhisUrl.dataSets,
                params: {
                    fields: metadataConf.fields.dataSets.params,
                    paging: metadataConf.fields.dataSets.paging
                },
                upsertFn: function (response) {
                    return dataSetRepository.upsertDhisDownloadedData(response);
                }
            }, {
                name: 'programs',
                url: dhisUrl.programs,
                params: {
                    fields: metadataConf.fields.programs.params,
                    paging: metadataConf.fields.programs.paging
                },
                upsertFn: function (response) {
                    return programRepository.upsertDhisDownloadedData(response);
                }
            }, {
                name: 'programStageSections',
                url: dhisUrl.programStageSections,
                params: {
                    fields: metadataConf.fields.programStageSections.params,
                    paging: metadataConf.fields.programStageSections.paging
                },
                upsertFn: function (response) {
                    return metadataRepository.upsertMetadataForEntity(response, 'programStageSections');
                }
            }, {
                name: 'systemSettings',
                url: dhisUrl.systemSettings,
                params: {
                    key: metadataConf.fields.systemSettings.key,
                    paging: metadataConf.fields.systemSettings.paging
                },
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
                    fields: metadataConf.fields.attributes.params,
                    paging: metadataConf.fields.attributes.paging
                },
                upsertFn: function (attributes) {
                    return metadataRepository.upsertMetadataForEntity(attributes, 'attributes');
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

            var downloadAndUpsertOrgUnits = function () {
                var upsertOrgUnits = function (orgUnits) {
                    return orgUnitRepository.upsertDhisDownloadedData(orgUnits);
                };

                var downloadAndUpdateChangeLog = function (downloadFunction, entityKey) {
                    return getChangeLog(entityKey).then(function (lastUpdatedTime) {
                        return lastUpdatedTime ? $q.when() : downloadFunction().then(upsertOrgUnits).then(_.partial(updateChangeLog, entityKey));
                    });
                };

                var downloadOrgUnitTree = function (orgUnitId) {
                    var entityKey = 'organisationUnits:' + orgUnitId;
                    return downloadAndUpdateChangeLog(_.partial(orgUnitService.getOrgUnitTree, orgUnitId), entityKey);
                };

                if(systemSettingRepository.getProductKeyLevel() === 'global') {
                    return downloadAndUpdateChangeLog(orgUnitService.getAll, 'organisationUnits');
                }
                else {
                    var allowedOrgUnits = systemSettingRepository.getAllowedOrgUnits() || [];
                    var orgUnitIds = _.map(allowedOrgUnits, 'id');
                    return _.reduce(orgUnitIds, function (result, orgUnitId) {
                        return result.then(_.partial(downloadOrgUnitTree, orgUnitId));
                    }, $q.when());
                }
            };

            var setSystemInfoDetails = function () {
                return setDownloadStartTime().then(setDhisVersion);
            };

            var updateMetadataChangeLog = function () {
                return changeLogRepository.upsert('metaData', updated);
            };

            var notify = function (percent) {
                deferred.notify({percent: percent});
            };

            var calculatePercent = function (num) {
                var totalNum = entities.length + 1;
                return _.floor((num / totalNum) * 100);
            };

            var increment = function (initialValue) {
                var count = initialValue;
                return function () {
                    count = count + 1;
                    return count;
                };
            };

            var incrementOne = increment(0);

            var computeProgress = _.flowRight(notify, calculatePercent, incrementOne);

            _.reduce(entities, function (promise, entity) {
                return promise.then(function () {
                    var downloadPromise = (entity.name == 'translations' && DHIS_VERSION != '2.23') ? $q.when() : downloadEntityIfNotExists(entity);
                    return downloadPromise.then(computeProgress);
                });
            }, setSystemInfoDetails())
                .then(downloadAndUpsertOrgUnits)
                .then(computeProgress)
                .then(updateMetadataChangeLog)
                .then(deferred.resolve)
                .catch(function (response) {
                    var data = (response.status === 401) ? "productKeyExpired" : "downloadFailed";
                    deferred.reject(data);
                });

            return deferred.promise;
        };
    };
});
