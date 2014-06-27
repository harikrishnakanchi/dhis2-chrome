define(["lodash"], function(_) {
    return function(db) {
        this.upsert = function(systemSettings) {
            var store = db.objectStore("systemSettings");
            var payload = {
                "key": systemSettings.projectId,
                "value": systemSettings.settings
            };
            return store.upsert(payload).then(function(){
                return payload;
            });
        };
    };
});
