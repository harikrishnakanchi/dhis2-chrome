define(["systemSettingRepository", "angularMocks", "utils"], function(SystemSettingRepository, mocks, utils) {
    describe("systemSettingRepository", function() {
        var repo, downloadedSettings, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            scope = $rootScope.$new();
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            repo = new SystemSettingRepository(mockDB.db);

        }));

        it("should upsert system settings", function() {
            var systemSetting = {
                "key": "12445",
                "value": {
                    "clientLastUpdated": "2015-01-01T11:00:00.000Z",
                    "dataElements": ["123452", "123457"]
                }
            };
            repo.upsert(systemSetting);
            expect(mockStore.upsert).toHaveBeenCalledWith(systemSetting);
        });

        it("should find all settings for modules", function() {
            var moduleIds = ["mod1", "mod2", "mod3"];
            var orgUnit = repo.findAll(moduleIds);
            scope.$apply();

            expect(mockStore.each).toHaveBeenCalled();
            expect(mockStore.each.calls.argsFor(0)[0].inList).toEqual(moduleIds);
        });

        it("should find all system settings given a project id", function() {
            var projectId = "12445";
            repo.getAllWithProjectId(projectId).then(function(data) {
                expect(data).toEqual({});
            });
            expect(mockStore.find).toHaveBeenCalledWith(projectId);
        });

    });
});