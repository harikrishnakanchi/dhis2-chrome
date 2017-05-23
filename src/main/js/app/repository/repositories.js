define(["dataRepository", "dataSetRepository", "userPreferenceRepository", "orgUnitRepository", "systemSettingRepository", "patientOriginRepository",
        "userRepository", "approvalDataRepository", "programRepository", "programEventRepository", "dataElementRepository", "excludedDataElementsRepository",
        "orgUnitGroupRepository", "changeLogRepository", "metadataRepository", "orgUnitGroupSetRepository", "optionSetRepository", "chartRepository",
        "referralLocationsRepository", "pivotTableRepository", "eventReportRepository", "dataSyncFailureRepository", "excludedLineListOptionsRepository", "categoryRepository",
        "indicatorRepository", "programIndicatorRepository", "customAttributeRepository"],
    function(dataRepository, dataSetRepository, userPreferenceRepository, orgUnitRepository, systemSettingRepository, patientOriginRepository,
        userRepository, approvalDataRepository, programRepository, programEventRepository, dataElementRepository, excludedDataElementsRepository,
        orgUnitGroupRepository, changeLogRepository, metadataRepository, orgUnitGroupSetRepository, optionSetRepository, chartRepository,
        referralLocationsRepository, pivotTableRepository, eventReportRepository, dataSyncFailureRepository, excludedLineListOptionsRepository, categoryRepository,
        indicatorRepository, programIndicatorRepository, customAttributeRepository) {
        var init = function(app) {
            app.service('dataRepository', ['$q', '$indexedDB', dataRepository]);
            app.service('approvalDataRepository', ['$indexedDB', '$q', approvalDataRepository]);
            app.service('dataSetRepository', ['$indexedDB', '$q', 'categoryRepository', dataSetRepository]);
            app.service('systemSettingRepository', ['$indexedDB', '$q', '$rootScope', systemSettingRepository]);
            app.service('patientOriginRepository', ['$indexedDB', '$q', patientOriginRepository]);
            app.service('orgUnitRepository', ['$indexedDB', '$q', orgUnitRepository]);
            app.service('userPreferenceRepository', ['$indexedDB', "orgUnitRepository", userPreferenceRepository]);
            app.service('userRepository', ['$indexedDB', userRepository]);
            app.service('programRepository', ['$indexedDB', '$q', 'dataElementRepository', programRepository]);
            app.service('programEventRepository', ['$indexedDB', '$q', 'dataElementRepository', programEventRepository]);
            app.service('dataElementRepository', ['$indexedDB', '$q', 'optionSetRepository', dataElementRepository]);
            app.service('orgUnitGroupRepository', ['$indexedDB', '$q', orgUnitGroupRepository]);
            app.service('changeLogRepository', ['$indexedDB', '$q', changeLogRepository]);
            app.service('metadataRepository', ['$indexedDB', "$q", metadataRepository]);
            app.service('orgUnitGroupSetRepository', ['$indexedDB', '$q', orgUnitGroupSetRepository]);
            app.service('optionSetRepository', ['$indexedDB', '$q', 'referralLocationsRepository', 'excludedLineListOptionsRepository', optionSetRepository]);
            app.service('chartRepository', ['$indexedDB', '$q', 'categoryRepository', 'dataElementRepository', 'indicatorRepository', 'programIndicatorRepository', chartRepository]);
            app.service('referralLocationsRepository', ['$indexedDB', '$q', 'dataSetRepository', referralLocationsRepository]);
            app.service('excludedDataElementsRepository', ['$indexedDB', '$q', excludedDataElementsRepository]);
            app.service('pivotTableRepository', ['$indexedDB', '$q', 'categoryRepository','dataElementRepository', 'indicatorRepository', 'programIndicatorRepository', pivotTableRepository]);
            app.service('eventReportRepository', ['$q', '$indexedDB', eventReportRepository]);
            app.service('dataSyncFailureRepository', ['$indexedDB', dataSyncFailureRepository]);
            app.service('excludedLineListOptionsRepository', ['$indexedDB', excludedLineListOptionsRepository]);
            app.service('categoryRepository', ['$indexedDB', '$q', categoryRepository]);
            app.service('indicatorRepository', ['$indexedDB', indicatorRepository]);
            app.service('programIndicatorRepository', ['$indexedDB', programIndicatorRepository]);
            app.service('customAttributeRepository', ['$indexedDB', customAttributeRepository]);
        };
        return {
            init: init
        };
    });
