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

        var backupEntireDB = function() {
            return getAllStoreNames().then(function(storeNames) {
                return backupStores(storeNames).then(function(data) {
                    return data;
                });
            });
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
            "backupStores": backupStores
        };
    };
});
