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

        var encodeBase64 = function(data) {
            return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
        };

        var decodeBase64 = function(data) {
            return decodeURIComponent(escape(atob(data)));
        };

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

        it("should create a back up of the entire db broken into chunks", function() {
            var getResultInChunks = function(count) {
                return _.times(count, function() {
                    return {};
                });
            };

            var store = db.objectStore("dataElements");
            store.getAll.and.returnValue(utils.getPromise(q, getResultInChunks(5001)));
            var expectedBackup = {
                "msf__store1__0": encodeBase64(getResultInChunks(5000)),
                "msf__store1__1": encodeBase64(getResultInChunks(1)),
                "msf__store2__0": encodeBase64(getResultInChunks(5000)),
                "msf__store2__1": encodeBase64(getResultInChunks(1)),
                "hustle": encodeBase64({
                    "store1": getResultInChunks(5001),
                    "store2": getResultInChunks(5001)
                })
            };

            indexeddbUtils.backupEntireDB().then(function(actualBackup) {
                expect(actualBackup).toEqual(expectedBackup);
            });

            expect(db.dbInfo).toHaveBeenCalled();

            scope.$digest();

        });

        it("should create a back up of the entire db", function() {
            var expectedBackup = {
                "msf__store1__0": encodeBase64(allResult),
                "msf__store2__0": encodeBase64(allResult),
                "hustle": encodeBase64({
                    "store1": allResult,
                    "store2": allResult
                })
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
                "msf__store1__0": encodeBase64([{
                    "id": "identity"
                }]),
                "msf__store2__0": encodeBase64([{
                    "id": "identity2"
                }]),
                "hustle": encodeBase64({
                    "hustleStore1": [{
                        "id": "identity3"
                    }]
                })
            };

            indexeddbUtils.restore(backupData);

            scope.$digest();
            expect(objectStore1.upsert).toHaveBeenCalledWith([{
                "id": "identity"
            }]);
            expect(objectStore2.upsert).toHaveBeenCalledWith([{
                "id": "identity2"
            }]);
            expect(hustleStore1.upsert).toHaveBeenCalledWith([{
                "id": "identity3"
            }]);
            expect(objectStore1.clear).toHaveBeenCalled();
            expect(objectStore2.clear).toHaveBeenCalled();
            expect(hustleStore1.clear).toHaveBeenCalled();
        });

        it("should not copy data for deleted objectstore from backup", function() {

            var objectStore3 = db.objectStore("store3");
            var hustleStore1 = db.objectStore("hustleStore1");

            var backupData = {
                "msf__store1__0": encodeBase64([{
                    "id": "identity"
                }]),
                "msf__store2__0": encodeBase64([{
                    "id": "identity2"
                }]),
                "msf__store3__0": encodeBase64([{
                    "id": "identity3"
                }]),
                "hustle": encodeBase64({
                    "hustleStore1": [{
                        "id": "identity4"
                    }]
                })
            };

            indexeddbUtils.restore(backupData);

            scope.$digest();
            expect(objectStore3.upsert).not.toHaveBeenCalledWith([{
                "id": "identity3"
            }]);
        });

        var getExpectedBackupResult = function(storeNames) {
            return _.zipObject(storeNames, _.times(storeNames.length, function() {
                return allResult;
            }));
        };
    });
});
