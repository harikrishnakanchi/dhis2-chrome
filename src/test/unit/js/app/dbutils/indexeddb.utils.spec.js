define(["indexeddbUtils", "angularMocks", "utils", "lodash"], function(IndexeddbUtils, mocks, utils, _) {
    describe("indexeddbUtils", function() {
        var q, db, storeNames, indexeddbUtils, rootScope, allResult;

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
            var eachResult = {};
            allResult = [{
                "id": "identity"
            }];

            q = $q;
            rootScope = $rootScope;
            db = utils.getMockDB(q, findResult, allResult, eachResult, dbInfo).db;

            indexeddbUtils = new IndexeddbUtils(db, q);
        }));

        it("should create a back up for the given stores", function(done) {
            var stores = [storeNames[0]];
            var objectStore1 = db.objectStore(storeNames[0]);
            var expectedBackup = getExpectedBackupResult(stores);

            indexeddbUtils.backupStores(stores).then(function(actualBackup) {
                expect(actualBackup).toEqual(expectedBackup);
            });

            expect(objectStore1.getAll).toHaveBeenCalled();

            rootScope.$digest();
            done();
        });

        it("should create a back up of the entire db", function(done) {
            var expectedBackup = getExpectedBackupResult(storeNames);

            indexeddbUtils.backupEntireDB().then(function(actualBackup) {
                expect(actualBackup).toEqual(expectedBackup);
            });

            expect(db.dbInfo).toHaveBeenCalled();

            rootScope.$digest();
            done();
        });

        var getExpectedBackupResult = function(storeNames) {
            return _.zipObject(storeNames, _.times(storeNames.length, function() {
                return allResult;
            }));
        };
    });
});
