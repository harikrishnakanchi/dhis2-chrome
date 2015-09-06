define(["lodash"], function(_) {
    return function(db, $q) {
        var upsert = function(systemSettings) {
            var store = db.objectStore("systemSettings");
            return store.upsert(systemSettings).then(function() {
                return systemSettings;
            });
        };

        var get = function(key) {
            var store = db.objectStore("systemSettings");
            return store.find(key).then(function(setting) {
                return setting.value;
            });
        };


        return {
            "upsert": upsert,
            "get": get
        };
    };
});
