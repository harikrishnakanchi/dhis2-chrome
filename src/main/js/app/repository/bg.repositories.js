define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "approvalDataRepository", "orgUnitRepository", "patientOriginRepository", "programEventRepository",
        "orgUnitGroupRepository", "changeLogRepository", "programRepository", "systemSettingRepository", "metadataRepository", "chartRepository",
        "referralLocationsRepository", "pivotTableRepository", "excludedDataElementsRepository", "dataSyncFailureRepository", "dataElementRepository",
        "excludedLineListOptionsRepository", "categoryRepository", "indicatorRepository", "programIndicatorRepository", "customAttributeRepository", "optionSetRepository"
    ],
    function(dataRepository, dataSetRepository, userPreferenceRepository, approvalDataRepository, orgUnitRepository, patientOriginRepository,
        programEventRepository, orgUnitGroupRepository, changeLogRepository, programRepository, systemSettingRepository, metadataRepository, chartRepository,
        referralLocationsRepository, pivotTableRepository, excludedDataElementsRepository, dataSyncFailureRepository, dataElementRepository,
             excludedLineListOptionsRepository, categoryRepository, indicatorRepository, programIndicatorRepository, customAttributeRepository, optionSetRepository) {
        var init = function(app) {
            app.service('dataRepository', ['$q', '$indexedDB', dataRepository]);
            app.service('dataSetRepository', ['$indexedDB', '$q', dataSetRepository]);
            app.service('orgUnitRepository', ['$indexedDB', '$q', orgUnitRepository]);
            app.service('userPreferenceRepository', ['$indexedDB', 'orgUnitRepository', userPreferenceRepository]);
            app.service('approvalDataRepository', ['$indexedDB', '$q', approvalDataRepository]);
            app.service('dataElementRepository', ['$indexedDB', '$q', 'optionSetRepository', dataElementRepository]);
            app.service('programEventRepository', ['$indexedDB', '$q', 'dataElementRepository', programEventRepository]);
            app.service('orgUnitGroupRepository', ['$indexedDB', '$q', orgUnitGroupRepository]);
            app.service('changeLogRepository', ['$indexedDB', '$q', changeLogRepository]);
            app.service('programRepository', ['$indexedDB', "$q", 'dataElementRepository', programRepository]);
            app.service('systemSettingRepository', ['$indexedDB', '$q', '$rootScope', systemSettingRepository]);
            app.service('patientOriginRepository', ['$indexedDB', '$q', patientOriginRepository]);
            app.service('excludedDataElementsRepository', ['$indexedDB', '$q', excludedDataElementsRepository]);
            app.service('metadataRepository', ['$indexedDB', "$q", metadataRepository]);
            app.service('chartRepository', ['$indexedDB', '$q', 'categoryRepository', 'dataElementRepository', 'indicatorRepository', 'programIndicatorRepository', chartRepository]);
            app.service('referralLocationsRepository', ['$indexedDB', '$q', 'dataSetRepository', referralLocationsRepository]);
            app.service('pivotTableRepository', ['$indexedDB', '$q', 'categoryRepository', 'dataElementRepository', 'indicatorRepository', 'programIndicatorRepository', pivotTableRepository]);
            app.service('dataSyncFailureRepository', ['$indexedDB', dataSyncFailureRepository]);
            app.service('excludedLineListOptionsRepository', ['$indexedDB', excludedLineListOptionsRepository]);
            app.service('categoryRepository', ['$indexedDB', '$q', categoryRepository]);
            app.service('indicatorRepository', ['$indexedDB', indicatorRepository]);
            app.service('programIndicatorRepository', ['$indexedDB', programIndicatorRepository]);
            app.service('customAttributeRepository', ['$indexedDB', customAttributeRepository]);
            app.service('optionSetRepository', ['$indexedDB', '$q', 'referralLocationsRepository', 'excludedLineListOptionsRepository', optionSetRepository]);
        };
        return {
            init: init
        };
    });
