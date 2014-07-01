define(["systemSettingRepository", "angularMocks", "utils"], function(SystemSettingRepository, mocks, utils) {
    describe("systemSettingRepository", function() {
        var repo;

        beforeEach(mocks.inject(function($q) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            repo = new SystemSettingRepository(mockDB.db);
        }));

        it("should upsert system settings", function() {
            var projectId = "12445";
            var expectedSystemSettings = {
                "excludedDataElements": {
                    "1": ["123452", "123457"]
                }
            };
            var systemSetting = {
                projectId: projectId,
                settings: expectedSystemSettings
            };
            repo.upsert(systemSetting);

            var expectedPayload = {
                key: projectId,
                value: expectedSystemSettings
            };
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedPayload);
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