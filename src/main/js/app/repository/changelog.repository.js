define(["lodash", "moment"], function(_, moment) {
    return function(db, $q) {
        this.upsert = function(type, lastUpdatedTime) {
            lastUpdatedTime = lastUpdatedTime || moment().toISOString();
            var store = db.objectStore("changeLog");
            return store.upsert({
                'type': type,
                'lastUpdatedTime': lastUpdatedTime
            });
        };

        this.clear = function(type) {
            var store = db.objectStore("changeLog");
            return store.getAll().then(function(allChangeLogs) {
                var deletePromises = [];
                _.each(allChangeLogs, function(changeLog) {
                    if (_.endsWith(type, ":") && _.startsWith(changeLog.type, type))
                        deletePromises.push(store.delete(changeLog.type));
                    if (!_.endsWith(type, ":") && changeLog.type === type)
                        deletePromises.push(store.delete(changeLog.type));
                });

                return $q.all(deletePromises);
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
