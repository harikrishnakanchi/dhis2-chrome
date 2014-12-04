define(["lodash"], function(_) {
    return function(db, $q) {

        var backupStores = function(storeNames) {
            var backupPromises = _.map(storeNames, function(name) {
                var store = db.objectStore(name);
                return store.getAll();
            });
            return $q.all(backupPromises).then(function(data) {
                return _.zipObject(storeNames, data);
            });
        };

        var truncate = function(storeNames) {
            var truncatePromises = _.map(storeNames, function(name) {
                var store = db.objectStore(name);
                return store.clear();
            });
            return $q.all(truncatePromises);
        };

        var backupEntireDB = function() {
            return getAllStoreNames().then(function(storeNames) {
                return backupStores(storeNames).then(function(data) {
                    return data;
                });
            });
        };

        var restore = function(backupData) {
            var storeNames = _.keys(backupData);

            var insertAll = function() {
                var insertPromises = _.map(storeNames, function(name) {
                    var store = db.objectStore(name);
                    store.insert(backupData[name]);
                });
                return $q.all(insertPromises);
            };

            return truncate(storeNames).then(insertAll);
        };

        var getAllStoreNames = function() {
            return db.dbInfo().then(function(data) {
                return _.map(data.objectStores, function(store) {
                    return store.name;
                });
            });
        };

        return {
            "backupEntireDB": backupEntireDB,
            "backupStores": backupStores,
            "restore": restore
        };
    };
});
