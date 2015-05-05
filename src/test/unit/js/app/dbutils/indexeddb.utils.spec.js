define(["indexeddbUtils", "angularMocks", "utils", "lodash"], function(IndexeddbUtils, mocks, utils, _) {
    describe("indexeddbUtils", function() {
        var q, db, storeNames, indexeddbUtils, scope, allResult;

        beforeEach(mocks.inject(function($q, $rootScope) {
            storeNames = ["store1", "store2"];

            var dbInfo = {
                "objectStores": [{
                    "name": storeNames[0]
                }, {
                    "name": storeNames[1]
                }]
            };

            var findResult = {};
            var eachResult = [{
                "id": "identity"
            }];
            allResult = [{
                "id": "identity"
            }];

            q = $q;
            scope = $rootScope.$new();
            db = utils.getMockDB(q, findResult, allResult, eachResult, dbInfo).db;

            indexeddbUtils = new IndexeddbUtils(db, q);
        }));

        it("should create a back up of entire stores if its a metadata store", function() {
            var stores = [storeNames[0]];
            var objectStore1 = db.objectStore(storeNames[0]);
            var expectedBackup = getExpectedBackupResult(stores);

            indexeddbUtils.backupStores("somedb", stores).then(function(actualBackup) {
                expect(actualBackup).toEqual(expectedBackup);
            });

            expect(objectStore1.getAll).toHaveBeenCalled();

            scope.$digest();
        });

        it("should create a back up of last 12 weeks data if its a project data store", function() {
            var stores = ["dataValues"];
            var objectStore1 = db.objectStore("dataValues");
            var expectedBackup = getExpectedBackupResult(stores);

            indexeddbUtils.backupStores("msf", stores).then(function(actualBackup) {
                expect(actualBackup).toEqual(expectedBackup);
            });

            expect(objectStore1.each).toHaveBeenCalled();

            scope.$digest();
        });

        it("should create a back up of the entire db", function() {
            var expectedBackup = {
                "msf__store1": allResult,
                "msf__store2": allResult,
                "hustle": {
                    "store1": allResult,
                    "store2": allResult
                }
            };

            indexeddbUtils.backupEntireDB().then(function(actualBackup) {
                expect(actualBackup).toEqual(expectedBackup);
            });

            expect(db.dbInfo).toHaveBeenCalled();

            scope.$digest();
        });

        it("should restore database from backup", function() {
            var store1 = storeNames[0];
            var store2 = storeNames[1];

            var objectStore1 = db.objectStore(store1);
            var objectStore2 = db.objectStore(store2);
            var hustleStore1 = db.objectStore("hustleStore1");

            var backupData = {
                "msf": {
                    store1: [{
                        "id": "identity"
                    }],
                    store2: [{
                        "id": "identity"
                    }]
                },
                "hustle": {
                    "hustleStore1": [{
                        "id": "identity"
                    }]
                }
            };

            indexeddbUtils.restore(backupData).then(function() {
                expect(objectStore1.insert).toHaveBeenCalledWith(backupData.msf[store1]);
                expect(objectStore2.insert).toHaveBeenCalledWith(backupData.msf[store2]);
                expect(hustleStore1.insert).toHaveBeenCalledWith(backupData.hustle.hustleStore1);
            });

            expect(objectStore1.clear).toHaveBeenCalled();
            expect(objectStore2.clear).toHaveBeenCalled();
            expect(hustleStore1.clear).toHaveBeenCalled();

            scope.$digest();
        });

        it("should create a backup of logs database", function() {
            var dbInfo = {
                "objectStores": [{
                    "name": "logs"
                }]
            };
            db.dbInfo.and.returnValue(utils.getPromise(q, dbInfo));

            var expectedBackup = {
                "msfLogs": getExpectedBackupResult(["logs"])
            };

            indexeddbUtils.backupLogs().then(function(actualBackup) {
                expect(actualBackup).toEqual(expectedBackup);
            });

            scope.$digest();
        });

        var getExpectedBackupResult = function(storeNames) {
            return _.zipObject(storeNames, _.times(storeNames.length, function() {
                return allResult;
            }));
        };
    });
});
