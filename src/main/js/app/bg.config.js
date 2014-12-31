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

        //md5
        "md5": "lib/js-md5/js/md5",

        //services
        "dataService": "app/service/data.service",
        "approvalService": "app/service/approval.service",
        "metadataService": "app/service/metadata.service",
        "orgUnitService": "app/service/orgUnit.service",
        "datasetService": "app/service/dataset.service",
        "systemSettingService": "app/service/system.setting.service",
        "userService": "app/service/user.service",
        "programService": "app/service/program.service",
        "eventService": "app/service/event.service",
        "services": "app/service/bg.services",
        "orgUnitGroupService": "app/service/orgUnitgroup.service",

        //Repositories
        "repositories": "app/repository/bg.repositories",
        "dataRepository": "app/repository/data.repository",
        "approvalDataRepository": "app/repository/approval.data.repository",
        "dataSetRepository": "app/repository/dataset.repository",
        "userPreferenceRepository": "app/repository/userpreference.repository",
        "orgUnitRepository": "app/repository/orgunit.repository",
        "programEventRepository": "app/repository/program.event.repository",
        "orgUnitGroupRepository": "app/repository/orgunit.group.repository",
        "changeLogRepository": "app/repository/changelog.repository",

        //Monitors
        "dhisMonitor": "app/monitors/dhis.monitor",
        "monitors": "app/monitors/monitors",

        //consumers
        "consumers": "app/consumer/consumers",
        "consumerRegistry": "app/consumer/consumer.registry",
        "downloadDataConsumer": "app/consumer/download.data.consumer",
        "downloadApprovalConsumer": "app/consumer/download.approval.consumer",
        "uploadDataConsumer": "app/consumer/upload.data.consumer",
        "uploadCompletionDataConsumer": "app/consumer/upload.completion.data.consumer",
        "uploadApprovalDataConsumer": "app/consumer/upload.approval.data.consumer",
        "downloadOrgUnitConsumer": "app/consumer/download.orgunit.consumer",
        "uploadOrgUnitConsumer": "app/consumer/upload.orgunit.consumer",
        "systemSettingConsumer": "app/consumer/system.setting.consumer",
        "datasetConsumer": "app/consumer/dataset.consumer",
        "createUserConsumer": "app/consumer/create.user.consumer",
        "updateUserConsumer": "app/consumer/update.user.consumer",
        "programConsumer": "app/consumer/program.consumer",
        "downloadEventDataConsumer": "app/consumer/download.event.data.consumer",
        "uploadEventDataConsumer": "app/consumer/upload.event.data.consumer",
        "deleteEventConsumer": "app/consumer/delete.event.consumer",
        "dispatcher": "app/consumer/dispatcher",
        "orgUnitGroupConsumer": "app/consumer/orgunitGroup.consumer",
        "downloadMetadataConsumer": "app/consumer/download.metadata.consumer",

        "angular-indexedDB": "lib/angular-indexedDB/src/indexeddb",

        //Interceptors
        "httpInterceptor": "app/interceptors/http.interceptor",

        //Queue
        "failureStrategyFactory": "app/queue/failure.strategy.factory",

        //Utils
        "chromeRuntime": "app/utils/chrome.runtime",
        "dhisId": "app/utils/dhis.id",
        "dateUtils": "app/utils/date.utils",
        "lodashUtils": "app/utils/lodash.utils"
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
