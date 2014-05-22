require.config({
    paths: {
        "Q": "lib/q/q",
        "lodash": "lib/lodash/dist/lodash",
        "properties": "app/conf/properties",
        "overrides": "app/conf/overrides",
        "jquery": "lib/custom/jquery-ajax/jquery",
        "httpWrapper": "app/utils/http.wrapper",
        "idb": "app/utils/idb",
        "indexedDBLogger": "app/utils/indexeddb.logger",
        "metadataSyncService": "app/bg/metadata.sync",
        "app": "app/bg.app",
        "hustle": "lib/hustle/hustle",
        "moment": "lib/moment/moment",
        "hustleInit": "app/hustle.init",

        "angular": "lib/angular/angular",

        //services
        "dataService": "app/service/data.service",
        "services": "app/service/bg.services",

        "angular-indexedDB": "lib/angular-indexedDB/src/indexeddb",
        "backgroundServicesRegistry": "app/bg/background.services.registry",
    },
    shim: {
        'angular': {
            exports: 'angular'
        },
        'angular-indexedDB': {
            deps: ["angular"]
        }
    }
});
console.log("Config is complete");