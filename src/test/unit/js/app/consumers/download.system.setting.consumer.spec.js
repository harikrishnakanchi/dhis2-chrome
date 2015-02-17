define(["downloadSystemSettingConsumer", "systemSettingService", "utils", "angularMocks", "systemSettingRepository", "timecop"],
    function(DownloadSystemSettingConsumer, SystemSettingService, utils, mocks, SystemSettingRepository, timecop) {
        var downloadSystemSettingConsumer, systemSettingService, q, allSystemSettings, systemSettingRepository, scope;
        describe("download system setting consumer", function() {
            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope.$new();
                q = $q;
                allSystemSettings = [{
                    key: "a467559322b",
                    value: {
                        clientLastUpdated: "2014-05-30T12:43:54.972Z",
                        dataElements: ["de1", "de2"]
                    }
                }, {
                    key: "b567559322c",
                    value: {
                        clientLastUpdated: "2014-05-30T12:43:54.972Z",
                        dataElements: ["de3", "de1"]
                    }
                }];
                systemSettingService = new SystemSettingService();
                systemSettingRepository = new SystemSettingRepository();
            }));

            it("should download excluded data elements", function() {
                spyOn(systemSettingService, "getAll").and.returnValue(utils.getPromise(q, allSystemSettings));
                spyOn(systemSettingRepository, "upsert");
                spyOn(systemSettingRepository, "findAll").and.returnValue(utils.getPromise(q, undefined));
                downloadSystemSettingConsumer = new DownloadSystemSettingConsumer(systemSettingService, systemSettingRepository);

                downloadSystemSettingConsumer.run();
                scope.$apply();
                expect(systemSettingService.getAll).toHaveBeenCalled();
                expect(systemSettingRepository.upsert).toHaveBeenCalledWith(allSystemSettings);
            });

            it("should not overwrite locally modified setting", function() {

                var locallyModifiedSetting = {
                    key: "a467559322b",
                    value: {
                        clientLastUpdated: "2014-05-30T12:50:54.972Z",
                        dataElements: ["de5", "de2"]
                    }
                };

                var expectedUpserts = [
                    locallyModifiedSetting, {
                        key: "b567559322c",
                        value: {
                            clientLastUpdated: "2014-05-30T12:43:54.972Z",
                            dataElements: ["de3", "de1"]
                        }
                    }
                ];

                spyOn(systemSettingService, "getAll").and.returnValue(utils.getPromise(q, allSystemSettings));
                spyOn(systemSettingRepository, "upsert");
                spyOn(systemSettingRepository, "findAll").and.returnValue(utils.getPromise(q, [locallyModifiedSetting]));

                downloadSystemSettingConsumer = new DownloadSystemSettingConsumer(systemSettingService, systemSettingRepository);
                downloadSystemSettingConsumer.run();

                scope.$apply();

                expect(systemSettingService.getAll).toHaveBeenCalled();
                expect(systemSettingRepository.upsert).toHaveBeenCalledWith(expectedUpserts);
            });

            it("should overwrite locally modified setting", function() {

                var locallyModifiedSetting = {
                    key: "a467559322b",
                    value: {
                        clientLastUpdated: "2014-05-30T12:41:54.972Z",
                        dataElements: ["de5", "de2"]
                    }
                };

                var expectedUpserts = allSystemSettings;

                spyOn(systemSettingService, "getAll").and.returnValue(utils.getPromise(q, allSystemSettings));
                spyOn(systemSettingRepository, "upsert");
                spyOn(systemSettingRepository, "findAll").and.returnValue(utils.getPromise(q, [locallyModifiedSetting]));

                downloadSystemSettingConsumer = new DownloadSystemSettingConsumer(systemSettingService, systemSettingRepository);
                downloadSystemSettingConsumer.run();

                scope.$apply();

                expect(systemSettingService.getAll).toHaveBeenCalled();
                expect(systemSettingRepository.upsert).toHaveBeenCalledWith(expectedUpserts);
            });
        });
    });