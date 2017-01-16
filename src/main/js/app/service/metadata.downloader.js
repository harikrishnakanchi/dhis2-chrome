define(['dhisUrl', 'moment', 'properties', 'lodash', 'pagingUtils'], function (dhisUrl, moment, properties, _, pagingUtils) {
    return function ($http, $q, changeLogRepository, metadataRepository, orgUnitGroupRepository, dataSetRepository, programRepository, systemSettingRepository, orgUnitRepository) {

        var TEMP_CHANGE_LOG_PREFIX = 'temp:',
            MAX_PAGE_REQUESTS = 500, updated;

        var entities = [{
            name: 'categories',
            url: dhisUrl.categories,
            params: {
                fields: 'id,name,shortName,created,dataDimension,dataDimensionType,lastUpdated,categoryOptions,categoryCombos,attributeValues[value,attribute[id,code,name]]'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'categories');
            }
        }, {
            name: 'categoryCombos',
            url: dhisUrl.categoryCombos,
            params: {
                fields: 'id,name,skipTotal,created,dataDimensionType,lastUpdated,categories,attributeValues[value,attribute[id,code,name]],categoryOptionCombos'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'categoryCombos');
            }
        }, {
            name: 'categoryOptionCombos',
            url: dhisUrl.categoryOptionCombos,
            params: {
                fields: 'id,name,created,shortName,lastUpdated,categoryCombo,categoryOptions,attributeValues[value,attribute[id,code,name]]'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'categoryOptionCombos');
            }
        }, {
            name: 'categoryOptions',
            url: dhisUrl.categoryOptions,
            params: {
                fields: 'id,name,shortName,created,lastUpdated,dimensionItemType,categories,organisationUnits,categoryOptionCombos,attributeValues[value,attribute[id,code,name]]'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'categoryOptions');
            }
        }, {
            name: 'dataElementGroups',
            url: dhisUrl.dataElementGroups,
            params: {
                fields: 'id,name,shortName,created,lastUpdated,attributeValues[value,attribute[id,code,name]],dataElements,dimensionItemType'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'dataElementGroups');
            }
        }, {
            name: 'dataElements',
            url: dhisUrl.dataElements,
            params: {
                fields: ':all,!href,!publicAccess,!externalAccess,!dimensionItem,!zeroIsSignificant,!url,!access,!user,' +
                '!userGroupAccesses,!aggregationLevels,optionSet[id,name,options[id,name,code]],categoryCombo,dataElementGroups,attributeValues[value,attribute[id,code,name]],dataSets'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'dataElements');
            }
        }, {
            name: 'indicators',
            url: dhisUrl.indicators,
            params: {
                fields: ':all,!href,!displayName,!publicAccess,!externalAccess,!displayShortName,!access,!userGroupAccesses,attributeValues[value,attribute[id,code,name]]'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'indicators');
            }
        }, {
            name: 'programIndicators',
            url: dhisUrl.programIndicators,
            params: {
                fields: ':all,!href,!displayName,!displayInForm,!publicAccess,!access,!userGroupAccesses,attributeValues[value,attribute[id,code,name]]'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'programIndicators');
            }
        }, {
            name: 'optionSets',
            url: dhisUrl.optionSets,
            params: {
                fields: 'id,name,code,created,lastUpdated,valueType,attributeValues[value,attribute[id,code,name]],options[id,name,code]'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'optionSets');
            }
        }, {
            name: 'organisationUnitGroupSets',
            url: dhisUrl.organisationUnitGroupSets,
            params: {
                fields: 'id,name,code,shortName,created,lastUpdated,description,dimensionType,dataDimension,organisationUnitGroups[id,name],attributeValues[value,attribute[id,code,name]]'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'organisationUnitGroupSets');
            }
        }, {
            name: 'sections',
            url: dhisUrl.sections,
            params: {
                fields: 'id,name,created,lastUpdated,sortOrder,dataSet,attributeValues[value,attribute[id,code,name]],indicators,dataElements'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'sections');
            }
        }, {
            name: 'translations',
            url: dhisUrl.translations,
            params: {
                fields: ':all,!access,!userGroupAccesses,!externalAccess,!href,attributeValues[value,attribute[id,code,name]]'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'translations');
            }
        }, {
            name: 'users',
            url: dhisUrl.users,
            params: {
                fields: ':all,!href,!externalAccess,!access,!teiSearchOrganisationUnits,!dataViewOrganisationUnits,!userGroupAccesses,userCredentials[:all,userRoles[:all]],organisationUnits[:all]'
            },
            upsertFn: function (response) {
                return metadataRepository.upsertMetadataForEntity(response, 'users');
            }
        }, {
            name: 'organisationUnitGroups',
            url: dhisUrl.organisationUnitGroups,
            params: {
                fields: ':all,!externalAccess,!access,!userGroupAccess,attributeValues[value,attribute[id,code,name]]'
            },
            upsertFn: function (response) {
                return orgUnitGroupRepository.upsertDhisDownloadedData(response);
            }
        }, {
            name: 'dataSets',
            url: dhisUrl.dataSets,
            params: {
                fields: ':all,attributeValues[:identifiable,value,attribute[:identifiable]],!organisationUnits'
            },
            upsertFn: function (response) {
                return dataSetRepository.upsertDhisDownloadedData(response);
            }
        }, {
            name: 'programs',
            url: dhisUrl.programs,
            params: {
                fields: 'id,name,displayName,organisationUnits,attributeValues[:identifiable,value,attribute[:identifiable]],programType,programStages[id,name,programStageSections[id,name,programStageDataElements[id,compulsory,dataElement[id,name]]]]'
            },
            upsertFn: function (response) {
                return programRepository.upsertDhisDownloadedData(response);
            }
        }, {
            name: 'organisationUnits',
            url: dhisUrl.orgUnits,
            params: {
                fields: ':all,parent[:identifiable],attributeValues[:identifiable,value,attribute[:identifiable]],dataSets,!access,!href,!uuid'
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
        }];

        var getChangeLog = function (entity) {
            return changeLogRepository.get(TEMP_CHANGE_LOG_PREFIX + entity);
        };

        var downloadAndUpsert = function (entity) {
            updated = moment().toISOString();
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
            return changeLogRepository.upsert(TEMP_CHANGE_LOG_PREFIX + entity, updated);
        };

        var downloadEntityIfNotExists = function (entity) {
            return getChangeLog(entity.name).then(function (lastUpdated) {
                return lastUpdated ? $q.when() : downloadAndUpsert(entity).then(_.partial(updateChangeLog, entity.name));
            });
        };

        this.run = function () {
            var deferred = $q.defer();

            _.reduce(entities, function (promise, entity, index) {
                return promise.then(function () {
                    return downloadEntityIfNotExists(entity).then(function () {
                        deferred.notify({percent: _.floor(((index + 1) / entities.length) * 100)});
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
