define(["lodash", "moment"], function(_, moment) {
    return function(db) {
        this.upsert = function(type, lastUpdatedTime) {
            lastUpdatedTime = lastUpdatedTime || moment().toISOString();
            var store = db.objectStore("changeLog");
            return store.upsert({
                'type': type,
                'lastUpdatedTime': lastUpdatedTime
            });
        };

        this.get = function(type) {
            var store = db.objectStore("changeLog");
            return store.find(type).then(function(data) {
                return data === undefined ? data : data.lastUpdatedTime;
            });
        };
    };
});
