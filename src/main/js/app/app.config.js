require.config({
    paths: {
        "angular": "lib/angular/angular",
        "Q": "lib/q/q",
        "lodash": "lib/lodash/lodash",
        "ng-i18n": "lib/ng-i18n/src/js/ng-i18n",
        "angular-route": "lib/angular-route/angular-route",
        "angular-resource": "lib/angular-resource/angular-resource",
        "migrations": "app/migrator/migrations",
        "migrator": "app/migrator/migrator",
        "properties": "app/conf/properties",
        "overrides": "app/conf/overrides",
        "moment": "lib/moment/min/moment-with-locales",
        "timecop": "lib/timecop/timecop-0.1.1",
        "hustle": "lib/hustle/hustle",
        "hustleModule": "lib/angularjs-hustle/hustle.module",
        "indexedDBLogger": "app/utils/indexeddb.logger",
        "JSZip": "lib/jszip/dist/jszip",
        "sjcl": "lib/sjcl/sjcl",

        //3rd party angular modules
        "angular-indexedDB": "lib/angular-indexedDB/src/indexeddb",
        "angular-ui-tabs": "lib/custom/angular-ui-tabs/tabs",
        "angular-ui-accordion": "lib/custom/angular-ui-accordion/accordion",
        "angular-ui-collapse": "lib/custom/angular-ui-collapse/collapse",
        "angular-ui-transition": "lib/custom/angular-ui-transition/transition",
        "angular-ui-modal": "lib/custom/angular-ui-modal/modal",
        "angular-ui-dropdown": "lib/custom/angular-ui-dropdown/dropdown",
        "angular-ui-weekselector": "lib/angularjs-directives/src/weekselector/week.selector",
        "angular-ui-notin": "lib/angularjs-directives/src/notIn/notIn",
        "angular-ui-equals": "lib/angularjs-directives/src/equals/equals",
        "angular-treeview": "lib/angularjs-directives/src/treeview/angular.treeview",
        "angular-multiselect": "lib/angularjs-directives/src/multiselect/multiselect",
        "angular-filter": "lib/angular-filter/dist/angular-filter",
        "angucomplete-alt": "lib/angularjs-directives/src/angucomplete-alt/angucomplete-alt",
        "md5": "lib/js-md5/js/md5",

        //Controllers
        "controllers": "app/controller/controllers",
        "dashboardController": "app/controller/dashboard.controller",
        "dataEntryApprovalDashboardController": "app/controller/data.entry.approval.dashboard.controller",
        "dataEntryController": "app/controller/data.entry.controller",
        "dataApprovalController": "app/controller/data.approval.controller",
        "aggregateDataEntryController": "app/controller/aggregate.data.entry.controller",
        "lineListDataEntryController": "app/controller/line.list.data.entry.controller",
        "lineListSummaryController": "app/controller/line.list.summary.controller",
        "orgUnitContoller": "app/controller/orgunit.controller",
        "opUnitController": "app/controller/opunit.controller",
        "aggregateModuleController": "app/controller/aggregate.module.controller",
        "lineListModuleController": "app/controller/line.list.module.controller",
        "lineListOfflineApprovalController": "app/controller/line.list.offline.approval.controller",
        "mainController": "app/controller/main.controller",
        "projectController": "app/controller/project.controller",
        "loginController": "app/controller/login.controller",
        "countryController": "app/controller/country.controller",
        "confirmDialogController": "app/controller/confirm.dialog.controller",
        "projectUserController": "app/controller/project.user.controller",
        "indicatorController": "app/controller/indicator.controller",
        "patientOriginController": "app/controller/patient.origin.controller",
        "productKeyController": "app/controller/product.key.controller",
        "appCloneController": "app/controller/app.clone.controller",
        "downloadDataController": "app/controller/download.data.controller",

        //Services
        "services": "app/service/services",
        "metadataService": "app/service/metadata.service",
        "dataService": "app/service/data.service",
        "orgUnitService": "app/service/orgunit.service",
        "datasetService": "app/service/dataset.service",
        "systemSettingService": "app/service/system.setting.service",
        "userService": "app/service/user.service",
        "approvalService": "app/service/approval.service",
        "programService": "app/service/program.service",
        "eventService": "app/service/event.service",
        "orgUnitGroupService": "app/service/orgunit.group.service",
        "filesystemService": "app/service/filesystem.service",

        //Repositories
        "repositories": "app/repository/repositories",
        "dataRepository": "app/repository/data.repository",
        "approvalDataRepository": "app/repository/approval.data.repository",
        "datasetRepository": "app/repository/dataset.repository",
        "systemSettingRepository": "app/repository/system.setting.repository",
        "userPreferenceRepository": "app/repository/userpreference.repository",
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

        //Transformers
        "extractHeaders": "app/transformers/extract.headers",
        "dataValuesMapper": "app/transformers/datavalues.mapper",
        "findCategoryComboOption": "app/transformers/find.category.combo.option",
        "orgUnitMapper": "app/transformers/orgunit.mapper",
        "toTree": "app/transformers/to.tree",
        "systemSettingsTransformer": "app/transformers/system.settings.transformer",
        "datasetTransformer": "app/transformers/dataset.transformer",
        "programTransformer": "app/transformers/program.transformer",

        //Database Utilities
        "dbutils": "app/dbutils/dbutils",
        "indexeddbUtils": "app/dbutils/indexeddb.utils",

        //Monitors
        "dhisMonitor": "app/monitors/dhis.monitor",
        "hustleMonitor": "app/monitors/hustle.monitor",
        "monitors": "app/monitors/monitors",

        //Queue
        "queuePostProcessInterceptor": "app/queue/queue.postprocess.interceptor",

        //Utils
        "chromeUtils": "app/utils/chrome.utils",
        "dhisId": "app/utils/dhis.id",
        "dateUtils": "app/utils/date.utils",
        "lodashUtils": "app/utils/lodash.utils",
        "httpUtils": "app/utils/http.utils",
        "dhisUrl": "app/utils/dhis.url",
        "zipUtils": "app/utils/zip.utils",
        "cipherUtils": "app/utils/cipher.utils",

        //Helpers
        "helpers": "app/helpers/helpers",
        "orgUnitGroupHelper": "app/helpers/orgunit.group.helper",
        "metadataImporter": "app/helpers/metadata.importer",
        "sessionHelper": "app/helpers/session.helper",
        "originOrgunitCreator": "app/helpers/origin.orgunit.creator"
    },
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
        'angular-resource': {
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
        'hustleModule': {
            deps: ["angular", "hustle"]
        },
        'angular-filter': {
            deps: ["angular"]
        }
    }
});
console.log("Config is complete");
