define(["lodash"], function(_) {
    return function(db) {
        this.get = function(username) {
            var store = db.objectStore('userPreferences');
            return store.find(username);
        };

        this.getAll = function() {
            var store = db.objectStore('userPreferences');
            return store.getAll();
        };

        this.save = function(userPreferences) {
            var store = db.objectStore('userPreferences');
            return store.upsert(userPreferences);
        };
    };
});