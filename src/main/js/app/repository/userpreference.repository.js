define(["lodash"], function(_) {
    return function(db) {
        this.get = function(username) {
            var store = db.objectStore('userPreferences');
            return store.find(username);
        };

        this.save = function(userPreferences) {
            var preferenceStore = db.objectStore('userPreferences');
            return preferenceStore.upsert(userPreferences);
        };
    };
});