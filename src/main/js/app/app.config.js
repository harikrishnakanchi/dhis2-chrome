require.config({
    paths: {
        "angular": "lib/angular/angular",
        "Q": "lib/q/q",
        "lodash": "lib/lodash/dist/lodash",
        "ng-i18n": "lib/ng-i18n/src/js/ng-i18n",
        "angular-route": "lib/angular-route/angular-route",
        "angular-resource": "lib/angular-resource/angular-resource",
        "migrations": "../data/migrations",
        "migrator": "app/migrator/migrator",
        "properties": "app/conf/properties",
        "overrides": "app/conf/overrides",
        "moment": "lib/moment/moment",

        //3rd party angular modules
        "angular-indexedDB": "lib/angular-indexedDB/src/indexeddb",
        "angular-ui-tabs": "lib/custom/angular-ui-tabs/tabs",
        "angular-ui-accordion": "lib/custom/angular-ui-accordion/accordion",
        "angular-ui-collapse": "lib/custom/angular-ui-collapse/collapse",
        "angular-ui-transition": "lib/custom/angular-ui-transition/transition",
        "angular-ui-modal": "lib/custom/angular-ui-modal/modal",
        "angular-ui-weekselector": "lib/angularjs-directives/src/weekselector/week.selector",
        "angular-ui-notin": "lib/angularjs-directives/src/notin/notIn",
        "angular-ui-equals": "lib/angularjs-directives/src/equals/equals",
        "angular-treeview": "lib/angularjs-directives/src/treeview/angular.treeview",
        "angular-multiselect": "lib/angularjs-directives/src/multiselect/multiselect",
        "md5": "lib/js-md5/js/md5",

        //Controllers
        "controllers": "app/controller/controllers",
        "dashboardController": "app/controller/dashboard.controller",
        "dataEntryController": "app/controller/data.entry.controller",
        "orgUnitContoller": "app/controller/orgunit.controller",
        "opUnitController": "app/controller/opunit.controller",
        "moduleController": "app/controller/module.controller",
        "mainController": "app/controller/main.controller",
        "projectController": "app/controller/project.controller",
        "loginController": "app/controller/login.controller",
        "countryController": "app/controller/country.controller",
        "confirmDialogController": "app/controller/confirm.dialog.controller",
        "projectUserController": "app/controller/project.user.controller",

        //Directives
        "directives": "app/directive/directives",

        //Services
        "services": "app/service/services",
        "metadataService": "app/service/metadata.service",
        "dataService": "app/service/data.service",
        "orgUnitService": "app/service/orgUnit.service",
        "userService": "app/service/user.service",
        "approvalService": "app/service/approval.service",

        //Transformers
        "extractHeaders": "app/transformers/extract.headers",
        "dataValuesMapper": "app/transformers/datavalues.mapper",
        "findCategoryComboOption": "app/transformers/find.category.combo.option",
        "orgUnitMapper": "app/transformers/orgunit.mapper",
        "toTree": "app/transformers/to.tree",
        "systemSettingsTransformer": "app/transformers/system.settings.transformer",
        "datasetTransformer": "app/transformers/dataset.transformer",
        "groupSections": "app/transformers/group.sections",

        //Interceptors
        "httpInterceptor": "app/interceptors/http.interceptor"
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
        }
    }
});
console.log("Config is complete");