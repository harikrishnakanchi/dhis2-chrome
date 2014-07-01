require.config({
    paths: {
        "Q": "lib/q/q",
        "lodash": "lib/lodash/dist/lodash",
        "ramda": "lib/ramda/ramda",
        "properties": "app/conf/properties",
        "overrides": "app/conf/overrides",
        "indexedDBLogger": "app/utils/indexeddb.logger",
        "app": "app/bg.app",
        "hustle": "lib/hustle/hustle",
        "moment": "lib/moment/moment",
        "hustleModule": "lib/angularjs-hustle/hustle.module",

        "angular": "lib/angular/angular",

        //services
        "dataService": "app/service/data.service",
        "approvalService": "app/service/approval.service",
        "metadataService": "app/service/metadata.service",
        "orgUnitService": "app/service/orgUnit.service",
        "datasetService": "app/service/dataset.service",
        "systemSettingService": "app/service/system.setting.service",
        "services": "app/service/bg.services",

        //Repositories
        "repositories": "app/repository/bg.repositories",
        "dataRepository": "app/repository/data.repository",
        "dataSetRepository": "app/repository/dataset.repository",
        "userPreferenceRepository": "app/repository/userpreference.repository",

        //Monitors
        "dhisMonitor": "app/monitors/dhis.monitor",
        "monitors": "app/monitors/monitors",

        //consumers
        "consumers": "app/consumer/consumers",
        "consumerRegistry": "app/consumer/consumer.registry",
        "dataValuesConsumer": "app/consumer/datavalues.consumer",
        "orgUnitConsumer": "app/consumer/orgunit.consumer",
        "datasetConsumer": "app/consumer/dataset.consumer",
        "systemSettingConsumer": "app/consumer/system.setting.consumer",
        "dispatcher": "app/consumer/dispatcher",

        "angular-indexedDB": "lib/angular-indexedDB/src/indexeddb",

        //Interceptors
        "httpInterceptor": "app/interceptors/http.interceptor",

        //Queue
        "failureStrategyFactory": "app/queue/failure.strategy.factory",

        //Utils
        "chromeRuntime": "app/utils/chrome.runtime"
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
        }
    }
});
console.log("Config is complete");
