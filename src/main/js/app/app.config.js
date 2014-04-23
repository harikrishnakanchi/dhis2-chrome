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
        "angular-treeview": "lib/angularjs-directives/src/treeview/angular.treeview",
        "md5": "lib/js-md5/js/md5",
        "angular-ui-datepicker": "lib/custom/angular-ui-datepicker/datepicker",
        "angular-ui-position": "lib/custom/angular-ui-position/position",


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

        //Directives
        "directives": "app/directive/directives",

        //Services
        "services": "app/service/services",
        "metadataService": "app/service/metadata.service",
        "dataService": "app/service/data.service",
        "projectsService": "app/service/projects.service",

        //Transformers
        "extractHeaders": "app/transformers/extract.headers",
        "dataValuesMapper": "app/transformers/datavalues.mapper",
        "findCategoryComboOption": "app/transformers/find.category.combo.option",
        "toTree": "app/transformers/to.tree"
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
        'angular-ui-position': {
            deps: ["angular"]
        },
        'angular-ui-datepicker': {
            deps: ["angular", "angular-ui-position"]
        },
    }
});
console.log("Config is complete");