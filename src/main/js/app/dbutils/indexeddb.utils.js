define(["lodash", "migrations"], function(_, migrations) {
    return function(db, $q) {
        var hustleDBVersion = 5001;

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

        var backupDB = function() {
            return getAllStoreNames().then(backupStores);
        };

        var backupEntireDB = function() {
            var backupMsf = function() {
                return backupDB();
            };

            var backupHustle = function() {
                db.switchDB("hustle", hustleDBVersion);
                return backupDB();
            };

            var msfData, hustleData;
            return backupMsf().then(function(data) {
                msfData = data;
                return data;
            }).then(backupHustle).then(function(data) {
                hustleData = data;
                db.switchDB("msf", migrations.length);
                return data;
            }).then(function() {
                return {
                    "msf": msfData,
                    "hustle": hustleData
                };
            });
        };

        var restore = function(backupData) {
            var restoreDB = function(data) {
                var storeNames = _.keys(data);

                var insertAll = function() {
                    var insertPromises = _.map(storeNames, function(name) {
                        var store = db.objectStore(name);
                        store.insert(data[name]);
                    });
                    return $q.all(insertPromises);
                };

                return truncate(storeNames).then(insertAll);
            };

            var restoreMsf = function(data) {
                return restoreDB(data);
            };

            var restoreHustle = function(data) {
                db.switchDB("hustle", hustleDBVersion);
                return restoreDB(data);
            };

            return restoreMsf(backupData.msf).then(function() {
                return restoreHustle(backupData.hustle).then(function() {
                    return db.switchDB("msf", migrations.length);
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
            "backupStores": backupStores,
            "restore": restore
        };
    };
});
