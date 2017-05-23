require.config({
    paths: {
        "angular": "lib/angular/angular.min",
        "Q": "lib/q/q",
        "d3": "lib/d3/d3.min",
        "d3-shim": "lib/custom/d3-shim/d3.shim",
        "nvd3": "lib/nvd3/nv.d3.min",
        "lodash": "lib/lodash/lodash.min",
        "ng-i18n": "lib/ng-i18n/ng-i18n-0.2.0.min",
        "angular-route": "lib/angular-route/angular-route.min",
        "migrations": "app/migrator/migrations",
        "migrator": "app/migrator/migrator",
        "properties": "app/conf/properties",
        "overrides": "app/conf/overrides",
        "metadataConf": "app/conf/metadata.conf",
        "moment": "lib/moment/moment-with-locales.min",
        "timecop": "lib/timecop/timecop-0.1.1",
        "hustle": "lib/hustle/hustle",
        "hustleModule": "lib/angularjs-hustle/hustle.module",
        "indexedDBLogger": "app/utils/indexeddb.logger",
        "JSZip": "lib/jszip/jszip.min",
        "sjcl": "lib/sjcl/sjcl",
        "saveSvgAsPng": "lib/save-svg-as-png/saveSvgAsPng",
        "angular-sanitize": "lib/angular-sanitize/angular-sanitize.min",
        "xlsx": "lib/js-xlsx-style/xlsx",

        //3rd party angular modules
        "angular-indexedDB": "lib/angular-indexedDB/indexeddb",
        "angular-ui-tabs": "lib/custom/angular-ui-tabs/tabs",
        "angular-ui-accordion": "lib/custom/angular-ui-accordion/accordion",
        "angular-ui-collapse": "lib/custom/angular-ui-collapse/collapse",
        "angular-ui-transition": "lib/custom/angular-ui-transition/transition",
        "angular-ui-modal": "lib/custom/angular-ui-modal/modal",
        "angular-ui-dropdown": "lib/custom/angular-ui-dropdown/dropdown",
        "angular-ui-tooltip": "lib/custom/angular-ui-tooltip/tooltip",
        "angular-ui-bindHtml": "lib/custom/angular-ui-bindHtml/bindHtml",
        "angular-ui-position": "lib/custom/angular-ui-position/position",
        "angular-ui-weekselector": "lib/angularjs-directives/src/weekselector/week.selector",
        "angular-ui-notin": "lib/angularjs-directives/src/notIn/notIn",
        "angular-ui-equals": "lib/angularjs-directives/src/equals/equals",
        "angular-treeview": "lib/angularjs-directives/src/treeview/angular.treeview",
        "angular-multiselect": "lib/angularjs-directives/src/multiselect/multiselect",
        "angular-filter": "lib/angular-filter/angular-filter.min",
        "angucomplete-alt": "lib/angularjs-directives/src/angucomplete-alt/angucomplete-alt",
        "angular-nvd3": "lib/angular-nvd3/angular-nvd3.min",
        "md5": "lib/js-md5/md5.min",

        //Controllers
        "controllers": "app/controller/controllers",
        "dashboardController": "app/controller/dashboard.controller",
        "moduleWeekSelectorController": "app/controller/module.week.selector.controller",
        "dataApprovalController": "app/controller/data.approval.controller",
        "aggregateDataEntryController": "app/controller/aggregate.data.entry.controller",
        "lineListDataEntryController": "app/controller/line.list.data.entry.controller",
        "lineListSummaryController": "app/controller/line.list.summary.controller",
        "orgUnitController": "app/controller/orgunit.controller",
        "opUnitController": "app/controller/opunit.controller",
        "aggregateModuleController": "app/controller/aggregate.module.controller",
        "lineListModuleController": "app/controller/line.list.module.controller",
        "lineListOfflineApprovalController": "app/controller/line.list.offline.approval.controller",
        "projectController": "app/controller/project.controller",
        "loginController": "app/controller/login.controller",
        "countryController": "app/controller/country.controller",
        "confirmDialogController": "app/controller/confirm.dialog.controller",
        "alertDialogController": "app/controller/alert.dialog.controller",
        "notificationDialogController": "app/controller/notification.dialog.controller",
        "projectUserController": "app/controller/project.user.controller",
        "indicatorController": "app/controller/indicator.controller",
        "patientOriginController": "app/controller/patient.origin.controller",
        "productKeyController": "app/controller/product.key.controller",
        "appCloneController": "app/controller/app.clone.controller",
        "downloadDataController": "app/controller/download.data.controller",
        "selectLanguageController": "app/controller/select.language.controller",
        "reportsController": "app/controller/reports.controller",
        "referralLocationsController": "app/controller/referral.locations.controller",
        "notificationsController": "app/controller/notifications.controller",
        "pivotTableController": "app/controller/pivot.table.controller",
        "selectProjectPreferenceController": "app/controller/select.project.preference.controller",
        "projectReportController": "app/controller/project.report.controller",
        "headerController": "app/controller/header.controller",
        "footerController": "app/controller/footer.controller",
        "exportRawDataController": "app/controller/export.raw.data.controller",
        "opUnitReportController": "app/controller/opunit.report.controller",
        "downloadMetadataController": "app/controller/download.metadata.controller",

        //Services
        "services": "app/service/services",
        "metadataService": "app/service/metadata.service",
        "dataService": "app/service/data.service",
        "orgUnitService": "app/service/orgunit.service",
        "dataSetService": "app/service/data.set.service",
        "systemSettingService": "app/service/system.setting.service",
        "userService": "app/service/user.service",
        "approvalService": "app/service/approval.service",
        "programService": "app/service/program.service",
        "eventService": "app/service/event.service",
        "orgUnitGroupService": "app/service/orgunit.group.service",
        "historyService": "app/service/history.service",
        "storageService": "app/service/storage.service",
        "systemInfoService": "app/service/system.info.service",
        "metadataDownloader": "app/service/metadata.downloader",

        //Repositories
        "repositories": "app/repository/repositories",
        "dataRepository": "app/repository/data.repository",
        "approvalDataRepository": "app/repository/approval.data.repository",
        "dataSetRepository": "app/repository/data.set.repository",
        "systemSettingRepository": "app/repository/system.setting.repository",
        "userPreferenceRepository": "app/repository/user.preference.repository",
        "orgUnitRepository": "app/repository/orgunit.repository",
        "userRepository": "app/repository/user.repository",
        "programRepository": "app/repository/program.repository",
        "programEventRepository": "app/repository/program.event.repository",
        "dataElementRepository": "app/repository/data.element.repository",
        "orgUnitGroupRepository": "app/repository/orgunit.group.repository",
        "changeLogRepository": "app/repository/changelog.repository",
        "indicatorRepository": "app/repository/indicator.repository",
        "metadataRepository": "app/repository/metadata.repository",
        "patientOriginRepository": "app/repository/patient.origin.repository",
        "orgUnitGroupSetRepository": "app/repository/org.unit.group.set.repository",
        "optionSetRepository": "app/repository/option.set.repository",
        "chartRepository": "app/repository/chart.repository",
        "referralLocationsRepository": "app/repository/referral.locations.repository",
        "excludedDataElementsRepository": "app/repository/excluded.dataelements.repository",
        "pivotTableRepository": "app/repository/pivot.table.repository",
        "dataSyncFailureRepository": "app/repository/data.sync.failure.repository",
        "excludedLineListOptionsRepository": "app/repository/excluded.line.list.options.repository",
        "categoryRepository": "app/repository/category.repository",
        "programIndicatorRepository": "app/repository/program.indicator.repository",
        "customAttributeRepository": "app/repository/custom.attribute.repository",
        "eventReportRepository": "app/repository/event.report.repository",

        //Models
        "chart": "app/models/chart",
        "pivotTable": "app/models/pivot.table",
        "moduleDataBlock": "app/models/module.data.block",
        "customAttributes": "app/models/custom.attributes",
        "pivotTableData": "app/models/pivot.table.data",
        "chartData": "app/models/chart.data",
        "analyticsData": "app/models/analytics.data",

        //Excel
        "excelBuilderHelper": "app/excel/excel.builder.helper",
        "excelBuilder": "app/excel/excel.builder",
        "excelStyles": "app/excel/excel.styles",

        //Factories
        "factories": "app/factories/factories",
        "moduleDataBlockFactory": "app/factories/module.data.block.factory",
        "checkVersionCompatibility": "app/factories/check.version.compatibility",
        "initializationRoutine": "app/factories/initialization.routine",

        //Transformers
        "dataEntryTableColumnConfig": "app/transformers/data.entry.table.column.config",
        "dataValuesMapper": "app/transformers/datavalues.mapper",
        "orgUnitMapper": "app/transformers/orgunit.mapper",
        "toTree": "app/transformers/to.tree",
        "systemSettingsTransformer": "app/transformers/system.settings.transformer",
        "dataSetTransformer": "app/transformers/data.set.transformer",
        "programTransformer": "app/transformers/program.transformer",
        "translationsService": "app/transformers/translations.service",
        "eventsAggregator": "app/transformers/events.aggregator",
        "transformers": "app/transformers/transformers",
        'optionSetTransformer': "app/transformers/option.set.transformer",

        //Database Utilities
        "dbutils": "app/dbutils/dbutils",
        "indexeddbUtils": "app/dbutils/indexeddb.utils",

        //Monitors
        "dhisMonitor": "app/monitors/dhis.monitor",
        "hustleMonitor": "app/monitors/hustle.monitor",
        "monitors": "app/monitors/monitors",

        //Interceptors
        "queueInterceptor": "app/queue/queue.interceptor",
        "configureRequestInterceptor": "app/interceptors/configure.request.interceptor",

        //Utils
        "dhisId": "app/utils/dhis.id",
        "dateUtils": "app/utils/date.utils",
        "lodashUtils": "app/utils/lodash.utils",
        "dhisUrl": "app/utils/dhis.url",
        "zipUtils": "app/utils/zip.utils",
        "cipherUtils": "app/utils/cipher.utils",
        "dataURItoBlob": "app/utils/data.uri.to.blob",
        "interpolate": "app/utils/interpolate",
        "xlsxLoader": "app/utils/xlsx.loader",
        "dataElementUtils": "app/utils/data.element.utils",
        "pagingUtils": "app/utils/paging.utils",
        "hustlePublishUtils": "app/utils/hustle.publish.utils",
        "productKeyUtils": "app/utils/product.key.utils",

        //Helpers
        "helpers": "app/helpers/helpers",
        "orgUnitGroupHelper": "app/helpers/orgunit.group.helper",
        "packagedDataImporter": "app/helpers/packaged.data.importer",
        "sessionHelper": "app/helpers/session.helper",
        "originOrgunitCreator": "app/helpers/origin.orgunit.creator",
        "pivotTableExportBuilder": "app/helpers/pivot.table.export.builder",
        "metadataHelper": "app/helpers/metadata.helper",

        //Directives
        "directives": "app/directives/directives",
        "pivotTableDirective": "app/directives/pivot.table",
        "lockedTableHeader": "app/directives/locked.table.header",
        "descriptionPopup": "app/directives/description.popup",

        //Constants
        "constants": "app/constants/constants"
    },
    waitSeconds: 0,
    shim: {
        "ng-i18n": {
            deps: ["angular"],
            exports: "i18n"
        },
        'angular': {
            exports: 'angular'
        },
        'angular-route': {
            deps: ["angular"]
        },
        'angular-indexedDB': {
            deps: ["angular"]
        },
        'angular-ui-tabs': {
            deps: ["angular"]
        },
        'angular-ui-transition': {
            deps: ["angular"]
        },
        'angular-treeview': {
            deps: ["angular"]
        },
        'angular-ui-collapse': {
            deps: ["angular", "angular-ui-transition"]
        },
        'angular-ui-modal': {
            deps: ["angular", "angular-ui-transition"]
        },
        'angular-ui-dropdown': {
            deps: ["angular"]
        },
        'angular-ui-accordion': {
            deps: ["angular", "angular-ui-collapse"]
        },
        'angular-ui-weekselector': {
            deps: ["angular", "moment"]
        },
        'angular-multiselect': {
            deps: ["angular"]
        },
        'angular-ui-equals': {
            deps: ["angular"]
        },
        'angular-ui-notin': {
            deps: ["angular"]
        },
        'angular-ui-tooltip': {
            deps: ["angular"]
        },
        'angular-ui-position': {
            deps: ["angular"]
        },
        'angular-ui-bindHtml': {
            deps: ["angular"]
        },
        'hustleModule': {
            deps: ["angular", "hustle"]
        },
        'angular-filter': {
            deps: ["angular"]
        },
        'nvd3': {
            deps: ["d3-shim"]
        },
        'angular-nvd3': {
            deps: ["nvd3", "angular"]
        },
        'angular-sanitize': {
            deps: ["angular"]
        },
        'xlsx': {
            exports: 'XLSX',
            deps: ['xlsxLoader']
        }
    }
});
console.log("Config is complete");