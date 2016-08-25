require.config({
    paths: {
        "Q": "lib/q/q",
        "lodash": "lib/lodash/lodash",
        "ng-i18n": "lib/ng-i18n/ng-i18n",
        "properties": "app/conf/properties",
        "overrides": "app/conf/overrides",
        "indexedDBLogger": "app/utils/indexeddb.logger",
        "app": "app/bg.app",
        "hustle": "lib/hustle/hustle",
        "moment": "lib/moment/moment-with-locales",
        "hustleModule": "lib/angularjs-hustle/hustle.module",
        "angular": "lib/angular/angular",
        "md5": "lib/js-md5/md5",
        "sjcl": "lib/sjcl/sjcl",

        //services
        "dataService": "app/service/data.service",
        "approvalService": "app/service/approval.service",
        "metadataService": "app/service/metadata.service",
        "orgUnitService": "app/service/orgunit.service",
        "datasetService": "app/service/dataset.service",
        "systemSettingService": "app/service/system.setting.service",
        "userService": "app/service/user.service",
        "programService": "app/service/program.service",
        "eventService": "app/service/event.service",
        "services": "app/service/bg.services",
        "orgUnitGroupService": "app/service/orgunit.group.service",
        "patientOriginService": "app/service/patient.origin.service",
        "reportService": "app/service/report.service",
        "dataStoreService": "app/service/datastore.service",

        //Repositories
        "repositories": "app/repository/bg.repositories",
        "dataRepository": "app/repository/data.repository",
        "approvalDataRepository": "app/repository/approval.data.repository",
        "datasetRepository": "app/repository/dataset.repository",
        "userPreferenceRepository": "app/repository/user.preference.repository",
        "orgUnitRepository": "app/repository/orgunit.repository",
        "programEventRepository": "app/repository/program.event.repository",
        "orgUnitGroupRepository": "app/repository/orgunit.group.repository",
        "changeLogRepository": "app/repository/changelog.repository",
        "programRepository": "app/repository/program.repository",
        "systemSettingRepository": "app/repository/system.setting.repository",
        "patientOriginRepository": "app/repository/patient.origin.repository",
        "excludedDataElementsRepository": "app/repository/excluded.dataelements.repository",
        "metadataRepository": "app/repository/metadata.repository",
        "chartRepository": "app/repository/chart.repository",
        "referralLocationsRepository": "app/repository/referral.locations.repository",
        "pivotTableRepository": "app/repository/pivot.table.repository",
        "dataSyncFailureRepository": "app/repository/data.sync.failure.repository",
        "dataElementRepository": "app/repository/data.element.repository",

        //Models
        "chart": "app/models/chart",
        "pivotTable": "app/models/pivot.table",
        "moduleDataBlock": "app/models/module.data.block",
        "customAttributes": "app/models/custom.attributes",
        "pivotTableData": "app/models/pivot.table.data",

        //Factories
        "factories":"app/factories/factories",
        "moduleDataBlockFactory": "app/factories/module.data.block.factory",
        "checkVersionCompatibility": "app/factories/check.version.compatibility",
        "initializationRoutine": "app/factories/initialization.routine",

        //Transformers
        "datasetTransformer": "app/transformers/dataset.transformer",
        "extractHeaders": "app/transformers/extract.headers",
        "findCategoryComboOption": "app/transformers/find.category.combo.option",

        //Monitors
        "dhisMonitor": "app/monitors/dhis.monitor",
        "hustleMonitor": "app/monitors/hustle.monitor",
        "monitors": "app/monitors/monitors",

        //consumers
        "consumers": "app/consumer/consumers",
        "consumerRegistry": "app/consumer/consumer.registry",
        "downloadDataConsumer": "app/consumer/download.data.consumer",
        "downloadApprovalConsumer": "app/consumer/download.approval.consumer",
        "uploadDataConsumer": "app/consumer/upload.data.consumer",
        "uploadCompletionDataConsumer": "app/consumer/upload.completion.data.consumer",
        "uploadApprovalDataConsumer": "app/consumer/upload.approval.data.consumer",
        "downloadOrgUnitConsumer": "app/consumer/download.orgunit.consumer",
        "uploadOrgUnitConsumer": "app/consumer/upload.orgunit.consumer",
        "downloadOrgUnitGroupConsumer": "app/consumer/download.orgunit.group.consumer",
        "uploadOrgUnitGroupConsumer": "app/consumer/upload.orgunit.group.consumer",
        "downloadDatasetConsumer": "app/consumer/download.dataset.consumer",
        "updateDatasetConsumer": "app/consumer/update.dataset.consumer",
        "removeOrgunitDatasetAssociationConsumer": "app/consumer/remove.orgunit.dataset.association.consumer",
        "createUserConsumer": "app/consumer/create.user.consumer",
        "updateUserConsumer": "app/consumer/update.user.consumer",
        "uploadProgramConsumer": "app/consumer/upload.program.consumer",
        "downloadProgramConsumer": "app/consumer/download.program.consumer",
        "uploadEventDataConsumer": "app/consumer/upload.event.data.consumer",
        "deleteEventConsumer": "app/consumer/delete.event.consumer",
        "dispatcher": "app/consumer/dispatcher",
        "downloadMetadataConsumer": "app/consumer/download.metadata.consumer",
        "deleteApprovalConsumer": "app/consumer/delete.approval.consumer",
        "downloadSystemSettingConsumer": "app/consumer/download.system.setting.consumer",
        "downloadProjectSettingsConsumer": "app/consumer/download.project.settings.consumer",
        "downloadPatientOriginConsumer": "app/consumer/download.patient.origin.consumer",
        "uploadExcludedDataElementsConsumer": "app/consumer/upload.excluded.dataelements.consumer",
        "uploadPatientOriginConsumer": "app/consumer/upload.patient.origin.consumer",
        "downloadPivotTablesConsumer": "app/consumer/download.pivot.tables.consumer",
        "downloadPivotTableDataConsumer": "app/consumer/download.pivot.table.data.consumer",
        "downloadChartsConsumer": "app/consumer/download.charts.consumer",
        "downloadChartDataConsumer": "app/consumer/download.chart.data.consumer",
        "uploadReferralLocationsConsumer": "app/consumer/upload.referral.locations.consumer",
        "downloadModuleDataBlocksConsumer": "app/consumer/download.module.data.blocks.consumer",
        "syncModuleDataBlockConsumer": "app/consumer/sync.module.data.block.consumer",
        "syncExcludedLinelistOptionsConsumer": "app/consumer/sync.excluded.linelist.options.consumer",

        //merge strategies
        "mergeBy": "app/consumer/mergestrategies/merge.by",
        "mergeByUnion": "app/consumer/mergestrategies/merge.by.union",
        "mergeByLastUpdated": "app/consumer/mergestrategies/merge.by.lastupdated",
        "moduleDataBlockMerger": "app/consumer/mergestrategies/module.data.block.merger",
        "aggregateDataValuesMerger": "app/consumer/mergestrategies/aggregate.data.values.merger",
        "lineListEventsMerger": "app/consumer/mergestrategies/line.list.events.merger",

        "angular-indexedDB": "lib/angular-indexedDB/indexeddb",

        //Interceptors
        "cleanupPayloadInterceptor": "app/interceptors/cleanup.payload.interceptor",
        "configureRequestInterceptor": "app/interceptors/configure.request.interceptor",
        "handleTimeoutInterceptor": "app/interceptors/handle.timeout.interceptor",
        "logRequestReponseInterceptor": "app/interceptors/log.request.response.interceptor",

        //Queue
        "queuePostProcessInterceptor": "app/queue/queue.postprocess.interceptor",

        //Utils
        "chromeUtils": "app/utils/chrome.utils",
        "dhisId": "app/utils/dhis.id",
        "dateUtils": "app/utils/date.utils",
        "lodashUtils": "app/utils/lodash.utils",
        "cipherUtils": "app/utils/cipher.utils",
        "httpUtils": "app/utils/http.utils",
        "dhisUrl": "app/utils/dhis.url",
        "interpolate": "app/utils/interpolate",
        "appSettingsUtils": "app/utils/app.settings.utils"
    },
    shim: {
        'angular': {
            exports: 'angular'
        },
        'angular-indexedDB': {
            deps: ["angular"]
        },
        'hustleModule': {
            deps: ["angular", "hustle"]
        },
        "ng-i18n": {
            deps: ["angular"],
            exports: "i18n"
        },
    }
});
console.log("Config is complete");
