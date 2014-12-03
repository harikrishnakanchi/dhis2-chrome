require.config({
    paths: {
        "angular": "lib/angular/angular",
        "Q": "lib/q/q",
        "lodash": "lib/lodash/dist/lodash",
        "ramda": "lib/ramda/ramda",
        "ng-i18n": "lib/ng-i18n/src/js/ng-i18n",
        "angular-route": "lib/angular-route/angular-route",
        "angular-resource": "lib/angular-resource/angular-resource",
        "migrations": "../data/migrations",
        "migrator": "app/migrator/migrator",
        "properties": "app/conf/properties",
        "overrides": "app/conf/overrides",
        "moment": "lib/moment/min/moment-with-locales",
        "timecop": "lib/timecop/timecop-0.1.1",
        "hustle": "lib/hustle/hustle",
        "hustleModule": "lib/angularjs-hustle/hustle.module",


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
        "md5": "lib/js-md5/js/md5",

        //Controllers
        "controllers": "app/controller/controllers",
        "dashboardController": "app/controller/dashboard.controller",
        "dataEntryController": "app/controller/data.entry.controller",
        "aggregateDataEntryController": "app/controller/aggregate.data.entry.controller",
        "lineListDataEntryController": "app/controller/line.list.data.entry.controller",
        "orgUnitContoller": "app/controller/orgunit.controller",
        "opUnitController": "app/controller/opunit.controller",
        "moduleController": "app/controller/module.controller",
        "mainController": "app/controller/main.controller",
        "projectController": "app/controller/project.controller",
        "loginController": "app/controller/login.controller",
        "countryController": "app/controller/country.controller",
        "confirmDialogController": "app/controller/confirm.dialog.controller",
        "projectUserController": "app/controller/project.user.controller",
        "selectProjectController": "app/controller/select.project.controller",

        //Services
        "services": "app/service/services",
        "metadataService": "app/service/metadata.service",
        "dataService": "app/service/data.service",
        "orgUnitService": "app/service/orgUnit.service",
        "datasetService": "app/service/dataset.service",
        "systemSettingService": "app/service/system.setting.service",
        "userService": "app/service/user.service",
        "approvalService": "app/service/approval.service",
        "programService": "app/service/program.service",
        "eventService": "app/service/event.service",
        "orgUnitGroupService": "app/service/orgUnitgroup.service",
        "filesystemService": "app/service/filesystem.service",

        //Repositories
        "repositories": "app/repository/repositories",
        "dataRepository": "app/repository/data.repository",
        "approvalDataRepository": "app/repository/approval.data.repository",
        "dataSetRepository": "app/repository/dataset.repository",
        "systemSettingRepository": "app/repository/system.setting.repository",
        "userPreferenceRepository": "app/repository/userpreference.repository",
        "orgUnitRepository": "app/repository/orgunit.repository",
        "userRepository": "app/repository/user.repository",
        "programRepository": "app/repository/program.repository",
        "programEventRepository": "app/repository/program.event.repository",
        "dataElementRepository": "app/repository/data.element.repository",
        "orgUnitGroupRepository": "app/repository/orgunit.group.repository",

        //Transformers
        "extractHeaders": "app/transformers/extract.headers",
        "dataValuesMapper": "app/transformers/datavalues.mapper",
        "findCategoryComboOption": "app/transformers/find.category.combo.option",
        "orgUnitMapper": "app/transformers/orgunit.mapper",
        "toTree": "app/transformers/to.tree",
        "systemSettingsTransformer": "app/transformers/system.settings.transformer",
        "datasetTransformer": "app/transformers/dataset.transformer",
        "groupSections": "app/transformers/group.sections",
        "approvalDataTransformer": "app/transformers/approval.data.transformer",
        "programTransformer": "app/transformers/program.transformer",

        //Database Utilities
        "dbutils": "app/dbutils/dbutils",
        "indexeddbUtils": "app/dbutils/indexeddb.utils",

        //Monitors
        "dhisMonitor": "app/monitors/dhis.monitor",
        "monitors": "app/monitors/monitors",

        //Interceptors
        "httpInterceptor": "app/interceptors/http.interceptor",

        //Queue
        "failureStrategyFactory": "app/queue/failure.strategy.factory",

        //Utils
        "chromeRuntime": "app/utils/chrome.runtime",
        "dhisId": "app/utils/dhis.id",

        //Helpers
        "helpers": "app/helpers/helpers",
        "approvalHelper": "app/helpers/approval.helper",
        "orgUnitGroupHelper": "app/helpers/orgUnitGroup.helper"

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
        }
    }
});
console.log("Config is complete");
