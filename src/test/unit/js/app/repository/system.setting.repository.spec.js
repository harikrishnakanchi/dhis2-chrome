define(["systemSettingRepository", "angularMocks", "utils"], function(SystemSettingRepository, mocks, utils) {
    describe("systemSettingRepository", function() {
        var repo, downloadedSettings;

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

        it("should upsert downloaded data", function() {
            var settings1 = {
                clientLastUpdated: "2014-05-30T12:43:54.972Z",
                dataElements: ["de3", "de1"]
            };

            var settings2 = {
                clientLastUpdated: "2014-05-30T12:43:54.972Z",
                dataElements: ["de3", "de1"]
            };

            downloadedSettings = {
                a467559322b: settings1,
                b567559322c: settings2
            };

            var expectedPayload = [{
                key: "a467559322b",
                value: settings1
            }, {
                key: "b567559322c",
                value: settings2
            }];

            repo.upsertDhisDownloadedData(downloadedSettings);
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedPayload);
        });
    });
});