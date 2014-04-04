require.config({
    paths: {
        "Q": "lib/q/q",
        "lodash": "lib/lodash/dist/lodash",
        "properties": "app/conf/properties",
        "jquery": "lib/custom/jquery-ajax/jquery",
        "httpWrapper": "app/utils/http.wrapper",
        "idb": "app/utils/idb",
        "indexedDBLogger": "app/utils/indexeddb.logger",
        "metadataSyncService": "app/bg/metadata.sync",
        "backgroundServicesRegistry": "app/bg/background.services.registry",
    },
});
console.log("Config is complete");