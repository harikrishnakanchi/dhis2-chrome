define(["downloadSystemSettingConsumer", "systemSettingService", "utils", "angularMocks", "systemSettingRepository", "timecop", "mergeBy"],
    function(DownloadSystemSettingConsumer, SystemSettingService, utils, mocks, SystemSettingRepository, timecop, MergeBy) {
        var downloadSystemSettingConsumer, systemSettingService, q, allSystemSettings, systemSettingRepository, scope, mergeBy;
        describe("download system setting consumer", function() {
            beforeEach(mocks.inject(function($q, $rootScope, $log) {
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
                }, {
                    key: "moduleTemplates",
                    value: {
                        "ds1": {
                            "temp1": [1, 2],
                            "temp2": [3, 4]
                        },
                        "ds2": {
                            "temp1": [1, 5],
                            "temp2": [8, 9]
                        }
                    }
                }];
                systemSettingService = new SystemSettingService();
                systemSettingRepository = new SystemSettingRepository();
                mergeBy = new MergeBy($log);
            }));

            it("should download excluded data elements", function() {
                spyOn(systemSettingService, "getAll").and.returnValue(utils.getPromise(q, allSystemSettings));
                spyOn(systemSettingRepository, "upsert");
                spyOn(systemSettingRepository, "findAll").and.returnValue(utils.getPromise(q, undefined));
                downloadSystemSettingConsumer = new DownloadSystemSettingConsumer(systemSettingService, systemSettingRepository, mergeBy);

                downloadSystemSettingConsumer.run();
                scope.$apply();
                expect(systemSettingService.getAll).toHaveBeenCalled();
                expect(systemSettingRepository.upsert).toHaveBeenCalledWith(allSystemSettings);
            });

            it("should not overwrite locally modified setting based on updated dateTime", function() {

                var locallyModifiedSetting = {
                    key: "a467559322b",
                    value: {
                        clientLastUpdated: "2014-05-30T12:50:54.972Z",
                        dataElements: ["de5", "de2"]
                    }
                };

                var expectedUpserts = [
                    locallyModifiedSetting, allSystemSettings[1], allSystemSettings[2]
                ];

                spyOn(systemSettingService, "getAll").and.returnValue(utils.getPromise(q, allSystemSettings));
                spyOn(systemSettingRepository, "upsert");
                spyOn(systemSettingRepository, "findAll").and.returnValue(utils.getPromise(q, [locallyModifiedSetting]));

                downloadSystemSettingConsumer = new DownloadSystemSettingConsumer(systemSettingService, systemSettingRepository, mergeBy);
                downloadSystemSettingConsumer.run();

                scope.$apply();

                expect(systemSettingService.getAll).toHaveBeenCalled();
                expect(systemSettingRepository.upsert).toHaveBeenCalledWith(expectedUpserts);
            });

            it("should overwrite locally modified setting based on updated dateTime", function() {

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

                downloadSystemSettingConsumer = new DownloadSystemSettingConsumer(systemSettingService, systemSettingRepository, mergeBy);
                downloadSystemSettingConsumer.run();

                scope.$apply();

                expect(systemSettingService.getAll).toHaveBeenCalled();
                expect(systemSettingRepository.upsert).toHaveBeenCalledWith(expectedUpserts);
            });

            it("should always overwrite the key moduleTemplates with data received remotely", function() {
                var newModuleTemplates = {
                    key: "moduleTemplates",
                    value: {
                        "ds5": {
                            "temp1": [1, 2],
                            "temp2": [3, 4]
                        }
                    }
                };
                var remoteSettings = [allSystemSettings[0], allSystemSettings[1], newModuleTemplates];
                spyOn(systemSettingService, "getAll").and.returnValue(utils.getPromise(q, remoteSettings));
                spyOn(systemSettingRepository, "upsert");
                spyOn(systemSettingRepository, "findAll").and.returnValue(utils.getPromise(q, allSystemSettings));

                downloadSystemSettingConsumer = new DownloadSystemSettingConsumer(systemSettingService, systemSettingRepository, mergeBy);
                downloadSystemSettingConsumer.run();

                scope.$apply();

                expect(systemSettingService.getAll).toHaveBeenCalled();
                expect(systemSettingRepository.upsert).toHaveBeenCalledWith(remoteSettings);
            });
        });
    });
