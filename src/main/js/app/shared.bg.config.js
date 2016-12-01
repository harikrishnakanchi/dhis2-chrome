require.config({
    paths: {
        "Q": "lib/q/q",
        "lodash": "lib/lodash/lodash.min",
        "ng-i18n": "lib/ng-i18n/ng-i18n-0.2.0.min",
        "properties": "app/conf/properties",
        "overrides": "app/conf/overrides",
        "indexedDBLogger": "app/utils/indexeddb.logger",
        "hustle": "lib/hustle/hustle",
        "moment": "lib/moment/moment-with-locales.min",
        "hustleModule": "lib/angularjs-hustle/hustle.module",
        "md5": "lib/js-md5/md5.min",
        "angular": "lib/angular/angular.min",
        "sjcl": "lib/sjcl/sjcl",

        //services
        "dataService": "app/service/data.service",
        "approvalService": "app/service/approval.service",
        "metadataService": "app/service/metadata.service",
        "orgUnitService": "app/service/orgunit.service",
        "dataSetService": "app/service/data.set.service",
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
        "dataSetRepository": "app/repository/data.set.repository",
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
        "excludedLineListOptionsRepository": "app/repository/excluded.line.list.options.repository",
        "categoryRepository": "app/repository/category.repository",

        //Models
        "chart": "app/models/chart",
        "pivotTable": "app/models/pivot.table",
        "moduleDataBlock": "app/models/module.data.block",
        "customAttributes": "app/models/custom.attributes",
        "pivotTableData": "app/models/pivot.table.data",
        "chartData": "app/models/chart.data",
        "analyticsData": "app/models/analytics.data",

        //Factories
        "factories":"app/factories/factories",
        "moduleDataBlockFactory": "app/factories/module.data.block.factory",
        "checkVersionCompatibility": "app/factories/check.version.compatibility",
        "initializationRoutine": "app/factories/initialization.routine",

        //Transformers
        "dataSetTransformer": "app/transformers/data.set.transformer",
        "dataEntryTableColumnConfig": "app/transformers/data.entry.table.column.config",

        //Monitors
        "dhisMonitor": "app/monitors/dhis.monitor",
        "hustleMonitor": "app/monitors/hustle.monitor",
        "monitors": "app/monitors/monitors",

        //consumers
        "consumers": "app/consumer/consumers",
        "consumerRegistry": "app/consumer/consumer.registry",
        "downloadOrgUnitConsumer": "app/consumer/download.orgunit.consumer",
        "uploadOrgUnitConsumer": "app/consumer/upload.orgunit.consumer",
        "downloadOrgUnitGroupConsumer": "app/consumer/download.orgunit.group.consumer",
        "uploadOrgUnitGroupConsumer": "app/consumer/upload.orgunit.group.consumer",
        "downloadDataSetConsumer": "app/consumer/download.data.set.consumer",
        "assignDataSetsToOrgUnitsConsumer": "app/consumer/assign.data.sets.to.org.units.consumer",
        "removeOrgUnitDataSetAssociationConsumer": "app/consumer/remove.org.unit.data.set.association.consumer",
        "createUserConsumer": "app/consumer/create.user.consumer",
        "updateUserConsumer": "app/consumer/update.user.consumer",
        "uploadProgramConsumer": "app/consumer/upload.program.consumer",
        "downloadProgramConsumer": "app/consumer/download.program.consumer",
        "dispatcher": "app/consumer/dispatcher",
        "downloadMetadataConsumer": "app/consumer/download.metadata.consumer",
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
        "associateOrgunitToProgramConsumer": "app/consumer/associate.orgUnit.to.program.consumer",
        "downloadHistoricalDataConsumer": "app/consumer/download.historical.data.consumer",
        "syncOrgUnitConsumer": "app/consumer/sync.orgunit.consumer",

        //merge strategies
        "mergeBy": "app/consumer/mergestrategies/merge.by",
        "mergeByUnion": "app/consumer/mergestrategies/merge.by.union",
        "mergeByLastUpdated": "app/consumer/mergestrategies/merge.by.lastupdated",
        "moduleDataBlockMerger": "app/consumer/mergestrategies/module.data.block.merger",
        "aggregateDataValuesMerger": "app/consumer/mergestrategies/aggregate.data.values.merger",
        "lineListEventsMerger": "app/consumer/mergestrategies/line.list.events.merger",
        "excludedLinelistOptionsMerger": "app/consumer/mergestrategies/excluded.linelist.options.merger",

        "angular-indexedDB": "lib/angular-indexedDB/indexeddb",

        //Interceptors
        "cleanupPayloadInterceptor": "app/interceptors/cleanup.payload.interceptor",
        "configureRequestInterceptor": "app/interceptors/configure.request.interceptor",
        "handleTimeoutInterceptor": "app/interceptors/handle.timeout.interceptor",
        "logRequestReponseInterceptor": "app/interceptors/log.request.response.interceptor",

        //Queue
        "queueInterceptor": "app/queue/queue.interceptor",

        //Utils
        "dhisId": "app/utils/dhis.id",
        "dateUtils": "app/utils/date.utils",
        "lodashUtils": "app/utils/lodash.utils",
        "cipherUtils": "app/utils/cipher.utils",
        "httpUtils": "app/utils/http.utils",
        "dhisUrl": "app/utils/dhis.url",
        "interpolate": "app/utils/interpolate"
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
        }
    }
});
