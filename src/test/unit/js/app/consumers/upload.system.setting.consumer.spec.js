define(["uploadSystemSettingConsumer", "systemSettingService", "utils", "angularMocks", "systemSettingRepository"],
    function(UploadSystemSettingConsumer, SystemSettingService, utils, mocks, SystemSettingRepository) {
        var scope, systemSettingRepository, systemSettingService, q;

        describe("upload system settings consumer", function() {
            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope.$new();
                q = $q;
                systemSettingService = new SystemSettingService();
                systemSettingRepository = new SystemSettingRepository();
            }));

            it("should upload system settings", function() {
                var payload = {
                    key: "mod1",
                    value: {
                        clientLastUpdated: "2014-05-30T12:43:54.972Z",
                        dataElements: ["de1", "de2", "de3"]
                    }
                };

                var message = {
                    data: {
                        data: payload,
                        type: "uploadSystemSettings"
                    }
                };

                spyOn(systemSettingService, "upsert");
                spyOn(systemSettingRepository, "get").and.returnValue(utils.getPromise(q, payload));
                var consumer = new UploadSystemSettingConsumer(systemSettingService, systemSettingRepository, q);
                consumer.run(message);
                scope.$apply();
                expect(systemSettingService.upsert).toHaveBeenCalledWith(payload);
            });
        });
    });