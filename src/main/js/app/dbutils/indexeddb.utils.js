define(["lodash", "migrations", "dateUtils", "properties", "moment"], function(_, migrations, dateUtils, properties, moment) {
    return function(db, $q, programEventRepository) {
        var hustleDBVersion = 5001;
        var msfLogsDBVersion = 5001;
        var CHUNK_SIZE = 5000;
        var MSF = "msf";
        var HUSTLE = "hustle";

        var backupByPeriod = function(storeName) {
            var startDate = dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSync);
            var startPeriod = dateUtils.toDhisFormat(moment(startDate));
            var endPeriod = dateUtils.toDhisFormat(moment());
            var store = db.objectStore(storeName);
            var query = db.queryBuilder().$between(startPeriod, endPeriod).$index("by_period").compile();
            return store.each(query);
        };

        var backupAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var backupByPeriodStores = ["dataValues", "programEvents"];

        var backupStores = function(dbName, storeNames) {
            var skipStores = ["systemSettings"];
            var backupPromises = _.map(storeNames, function(name) {
                if (!_.contains(skipStores, name)) {
                    var callback = (_.contains(backupByPeriodStores, name)) && (dbName === MSF) ? backupByPeriod : backupAll;
                    return callback(name);
                }
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

        var backupDB = function(dbName) {
            return getAllStoreNames().then(_.partial(backupStores, dbName));
        };

        var encodeBase64 = function(data) {
            return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        };

        var decodeBase64 = function(data) {
            return decodeURIComponent(escape(atob(data)));
        };

        var backupEntireDB = function() {
            var backupMsf = function() {
                return backupDB(MSF);
            };

            var backupHustle = function() {
                db.switchDB(HUSTLE, hustleDBVersion);
                return backupDB(HUSTLE);
            };

            var msfData, hustleData;
            return backupMsf().then(function(data) {
                msfData = _.reduce(data, function(result, value, key) {
                    var valueChunks = _.chunk(value, CHUNK_SIZE);
                    _.each(valueChunks, function(chunk, index) {
                        result[MSF + "__" + key + "__" + index] = encodeBase64(chunk);
                    });
                    return result;
                }, {});
                return data;
            }).then(backupHustle).then(function(data) {
                hustleData = data;
                db.switchDB(MSF, migrations.length);
                return data;
            }).then(function() {
                return _.merge(msfData, {
                    "hustle": encodeBase64(hustleData)
                });
            });
        };

        var backupLogs = function() {
            db.switchDB("msfLogs", msfLogsDBVersion);
            return backupDB().then(function(logsData) {
                db.switchDB(MSF, migrations.length);
                return {
                    "msfLogs": logsData
                };
            });
        };

        var restore = function(backupData) {
            var restoreDB = function(data) {
                var storeNames = _.keys(data);

                var insertAll = function() {
                    var insertPromises = _.map(storeNames, function(name) {
                        var store = db.objectStore(name);
                        store.insert(_.flatten(data[name]));
                    });
                    return $q.all(insertPromises);
                };

                return truncate(storeNames).then(insertAll);
            };

            var decodeData = function(data) {
                var result = {};
                _.each(data, function(val, key) {
                    var obj = {};
                    result[key] = decodeBase64(val);

                });
                return result;
            };

            var restoreMsf = function(data) {
                var backupDataByStore = {};
                _.each(data, function(val, key) {
                    if (key != "hustle") {
                        var store = key.split("__")[1];
                        var index = key.split("__")[2];
                        if (_.isEmpty(backupDataByStore[store])) {
                            backupDataByStore[store] = [];
                        }
                        backupDataByStore[store][index] = JSON.parse(val);
                    }
                });
                return restoreDB(backupDataByStore);
            };

            var restoreHustle = function(data) {
                db.switchDB(HUSTLE, hustleDBVersion);
                return restoreDB(JSON.parse(data));
            };

            backupData = decodeData(backupData);
            return restoreMsf(backupData).then(function() {
                return restoreHustle(backupData.hustle).then(function() {
                    return db.switchDB(MSF, migrations.length);
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
            "restore": restore,
            "backupLogs": backupLogs
        };
    };
});
