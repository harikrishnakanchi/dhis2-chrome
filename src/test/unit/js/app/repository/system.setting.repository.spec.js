define(["systemSettingRepository", "angularMocks", "utils", "dhisId"], function(SystemSettingRepository, mocks, utils, dhisId) {
    describe("systemSettingRepository", function() {
        var repo, scope, q;

        beforeEach(mocks.inject(function($q, $rootScope) {
            scope = $rootScope.$new();
            q = $q;
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            repo = new SystemSettingRepository(mockDB.db, q);
            spyOn(dhisId, "get").and.returnValue("ade3fab1ab0");
        }));

        it("should upsert system settings", function() {
            var systemSettings = [{
                "key": "moduleTemplates",
                "value": {
                    "ds1": {}
                }
            }, {
                "key": "anotherSetting",
                "value": "foo"
            }];

            repo.upsert(systemSettings);
            expect(mockStore.upsert).toHaveBeenCalledWith(systemSettings);
        });

        it("should find all system settings given a project id", function() {
            var key = "moduleTemplates";

            mockStore.find.and.returnValue(utils.getPromise(q, {
                "key": "moduleTemplates",
                "value": {
                    "ds1": {}
                }
            }));

            var actualResult;
            repo.get(key).then(function(data) {
                actualResult = data;
            });
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith(key);
            expect(actualResult).toEqual({
                "ds1": {}
            });
        });

        it("should get praxisUid from Object store", function() {

            mockStore.find.and.returnValue(utils.getPromise(q, {
                "key": "praxisUid",
                "value": "ade3fab1ab0"
            }));

            var actualResult;
            repo.getPraxisUid().then(function(data) {
                actualResult = data;
            });
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith("praxisUid");
            expect(actualResult).toEqual("ade3fab1ab0");
        });

        it("should insert praxisUid if it's not there in Object store", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, undefined));
            spyOn(repo, "upsert").and.returnValue(utils.getPromise(q, {
                "key": "praxisUid",
                "value": "ade3fab1ab0"
            }));

            var actualResult;
            repo.getPraxisUid().then(function(data) {
                actualResult = data;
            });
            scope.$apply();

            expect(mockStore.upsert).toHaveBeenCalledWith({
                "key": "praxisUid",
                "value": "ade3fab1ab0"
            });
            expect(actualResult).toEqual("ade3fab1ab0");
        });

    });
});
