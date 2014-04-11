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
        "moment": "lib/moment/moment",

        //3rd party angular modules
        "angular-indexedDB": "lib/angular-indexedDB/src/indexeddb",
        "angular-ui-tabs": "lib/custom/angular-ui-tabs/tabs",
        "angular-ui-accordion": "lib/custom/angular-ui-accordion/accordion",
        "angular-ui-collapse": "lib/custom/angular-ui-collapse/collapse",
        "angular-ui-transition": "lib/custom/angular-ui-transition/transition",
        "angular-ui-weekselector": "lib/angularjs-directives/src/weekselector/week.selector",
        "angular-treeview": "lib/angular-treeview/angular.treeview",


        //Controllers
        "controllers": "app/controller/controllers",
        "dashboardController": "app/controller/dashboard.controller",
        "dataEntryController": "app/controller/data.entry.controller",
        "projectsController": "app/controller/projects.controller",
        "mainController": "app/controller/main.controller",

        //Directives
        "directives": "app/directive/directives",

        //Services
        "services": "app/service/services",
        "metadataService": "app/service/metadata.service",
        "dataService": "app/service/data.service",

        //Transformers
        "extractHeaders": "app/transformers/extract.headers",
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
        'angular-ui-accordion': {
            deps: ["angular", "angular-ui-collapse"]
        },
        'angular-ui-weekselector': {
            deps: ["angular", "moment"]
        },
    }
});
console.log("Config is complete");