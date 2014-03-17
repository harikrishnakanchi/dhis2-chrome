require.config({
    paths: {
        "angular": "lib/angular/angular",
        "Q": "lib/q/q",
        "lodash": "lib/lodash/dist/lodash",
        "ng-i18n": "lib/ng-i18n/src/js/ng-i18n",
        "angular-route": "lib/angular-route/angular-route",
        "angular-resource": "lib/angular-resource/angular-resource",
        "angular-indexedDB": "lib/angular-indexedDB/src/indexeddb",
        "migrations": "../db/migrations",
        "migrator": "app/migrator/migrator",
        "properties": "app/conf/properties",

        //Controllers
        "controllers": "app/controller/controllers",
        "dashboardController": "app/controller/dashboard.controller",

        //Directives
        "directives": "app/directive/directives",

        //Services
        "services": "app/service/services",
        "metadataSyncService": "app/service/metadata.sync.service",
        "some": "app/data/some"
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
            deps: ["angular"],
            exports: 'angular_route'
        },
        'angular-indexedDB': {
            deps: ["angular"],
            exports: 'angular_indexedDB'
        },
        'angular-resource': {
            deps: ["angular"],
            exports: 'angular_resource'
        }
    }
});
console.log("Config is complete");