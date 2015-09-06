define(["systemSettingRepository", "angularMocks", "utils"], function(SystemSettingRepository, mocks, utils) {
    describe("systemSettingRepository", function() {
        var repo, scope, q;

        beforeEach(mocks.inject(function($q, $rootScope) {
            scope = $rootScope.$new();
            q = $q;
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            repo = new SystemSettingRepository(mockDB.db);
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

    });
});
