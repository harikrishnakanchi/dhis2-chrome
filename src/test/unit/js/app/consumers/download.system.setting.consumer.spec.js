define(["downloadSystemSettingConsumer", "systemSettingService", "utils", "angularMocks", "systemSettingRepository"],
    function(DownloadSystemSettingConsumer, SystemSettingService, utils, mocks, SystemSettingRepository) {
        describe("downloadSystemSettingConsumer", function() {
            var scope, q;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();
            }));

            it("should download system settings", function() {
                var systemSettings = [{
                    "key": "someSetting",
                    "value": {
                        "id": "foo"
                    }
                }];

                var systemSettingService = new SystemSettingService();
                var systemSettingRepository = new SystemSettingRepository();

                spyOn(systemSettingService, "getSystemSettings").and.returnValue(utils.getPromise(q, systemSettings));
                spyOn(systemSettingRepository, "upsert");

                downloadSystemSettingConsumer = new DownloadSystemSettingConsumer(systemSettingService, systemSettingRepository);

                downloadSystemSettingConsumer.run();
                scope.$apply();

                expect(systemSettingService.getSystemSettings).toHaveBeenCalled();
                expect(systemSettingRepository.upsert).toHaveBeenCalledWith(systemSettings);
            });
        });
    });
