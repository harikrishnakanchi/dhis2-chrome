define(["angularMocks", "utils", "systemSettingService", "userPreferenceRepository", "referralLocationsRepository", "patientOriginRepository", "excludedDataElementsRepository", "downloadProjectSettingsConsumer", "mergeBy", "excludedLinelistOptionsMerger", "changeLogRepository", "dataStoreService", "orgUnitRepository"],
    function (mocks, utils, SystemSettingService, UserPreferenceRepository, ReferralLocationsRepository, PatientOriginRepository, ExcludedDataElementsRepository, DownloadProjectSettingsConsumer, MergeBy, ExcludedLinelistOptionsMerger, ChangeLogRepository, DataStoreService, OrgUnitRepository) {
        describe("downloadProjectSettingsConsumer", function () {
            var consumer,
                systemSettingService,
                referralLocationsRepository,
                patientOriginRepository,
                orgUnitRepository,
                userPreferenceRepository,
                excludedDataElementsRepository,
                q,
                scope,
                mergeBy,
                excludedLinelistOptionsMerger,
                changeLogRepository,
                dataStoreService;

            beforeEach(mocks.inject(function ($q, $rootScope, $log) {

                q = $q;
                scope = $rootScope.$new();

                systemSettingService = new SystemSettingService();
                spyOn(systemSettingService, "getProjectSettings").and.returnValue(utils.getPromise(q, {}));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, "getCurrentUsersProjectIds").and.returnValue(utils.getPromise(q, []));

                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(referralLocationsRepository, "findAll").and.returnValue(utils.getPromise(q, {}));

                patientOriginRepository = new PatientOriginRepository();
                spyOn(patientOriginRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, {}));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(excludedDataElementsRepository, "findAll").and.returnValue(utils.getPromise(q, []));

                excludedLinelistOptionsMerger = new ExcludedLinelistOptionsMerger();
                spyOn(excludedLinelistOptionsMerger, 'mergeAndSaveForProject').and.returnValue(utils.getPromise(q, undefined));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, "2017-05-01T19:10:13.677Z"));

                dataStoreService = new DataStoreService({});
                spyOn(dataStoreService, "getUpdatedKeys").and.returnValue(utils.getPromise(q, {}));
                spyOn(dataStoreService, "getReferrals").and.returnValue(utils.getPromise(q, []));
                spyOn(dataStoreService, "getExcludedDataElements").and.returnValue(utils.getPromise(q, []));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, 'getAllOpUnitsInOrgUnits').and.returnValue(utils.getPromise(q, []));

                mergeBy = new MergeBy($log);

                consumer = new DownloadProjectSettingsConsumer(q, systemSettingService, userPreferenceRepository, referralLocationsRepository, patientOriginRepository, excludedDataElementsRepository, mergeBy, excludedLinelistOptionsMerger, changeLogRepository, dataStoreService, orgUnitRepository);
            }));

            it("should download project settings for current user projects", function () {
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1', 'prj2']));

                consumer.run();
                scope.$apply();

                expect(systemSettingService.getProjectSettings).toHaveBeenCalledWith(['prj1', 'prj2']);
            });

            it('should get changeLogs for all projectIds', function () {
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1', 'prj2']));

                consumer.run();
                scope.$apply();

                expect(changeLogRepository.get).toHaveBeenCalledWith('projectSettings:prj1');
                expect(changeLogRepository.get).toHaveBeenCalledWith('projectSettings:prj2');
            });

            it('should get minimum lastUpdated time from all lastUpdated times and get updated keys', function () {
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1', 'prj2']));
                changeLogRepository.get.and.returnValues(utils.getPromise(q, "2017-05-01T19:10:13.677Z"), utils.getPromise(q, "2017-05-01T15:10:13.677Z"));

                consumer.run();
                scope.$apply();

                expect(dataStoreService.getUpdatedKeys).toHaveBeenCalledWith("2017-05-01T15:10:13.677Z");
            });

            it('should get all modules and opUnits for all projectIds', function () {
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1', 'prj2']));

                consumer.run();
                scope.$apply();

                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(['prj1', 'prj2']);
                expect(orgUnitRepository.getAllOpUnitsInOrgUnits).toHaveBeenCalledWith(['prj1', 'prj2']);
            });

            describe('referralLocations', function () {
                beforeEach(function () {
                    userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1']));
                    dataStoreService.getUpdatedKeys.and.returnValue(utils.getPromise(q, {referralLocations: ["opUnit1", "opUnit2"]}));
                    orgUnitRepository.getAllOpUnitsInOrgUnits.and.returnValue(utils.getPromise(q, [{id: "opUnit1"}]));
                });
                it('should download referralLocations only relevant to current project ids', function () {
                    consumer.run();
                    scope.$apply();

                    expect(dataStoreService.getReferrals).toHaveBeenCalledWith(["opUnit1"]);
                });

                it('should get local referral locations only relevant to current project ids', function () {
                    consumer.run();
                    scope.$apply();

                    expect(referralLocationsRepository.findAll).toHaveBeenCalledWith(["opUnit1"]);
                });

                it('should merge referral locations based on clientLastUpdated time', function () {
                    var mockRemoteReferrals = [{
                        "orgUnit": "opUnit1",
                        "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                    }, {
                        "orgUnit": "opUnit2",
                        "clientLastUpdated": "2015-07-18T07:00:00.000Z"
                    }];

                    var referralLocationFromLocalDb = [{
                        "orgUnit": "opUnit1",
                        "facility 1": {
                            "value": "some alias"
                        },
                        "clientLastUpdated": "2015-07-17T08:00:00.000Z"
                    }];
                    userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1']));
                    dataStoreService.getUpdatedKeys.and.returnValue(utils.getPromise(q, {referralLocations: ["opUnit1", "opUnit2"]}));
                    orgUnitRepository.getAllOpUnitsInOrgUnits.and.returnValue(utils.getPromise(q, [{id: "opUnit1"}, {id: "opUnit2"}]));
                    dataStoreService.getReferrals.and.returnValue(utils.getPromise(q, mockRemoteReferrals));
                    referralLocationsRepository.findAll.and.returnValue(utils.getPromise(q, referralLocationFromLocalDb));

                    consumer.run();
                    scope.$apply();

                    var expectedPayload = [{
                        "orgUnit": "opUnit1",
                        "facility 1": {
                            "value": "some alias"
                        },
                        "clientLastUpdated": "2015-07-17T08:00:00.000Z"
                    }, {
                        "orgUnit": "opUnit2",
                        "clientLastUpdated": "2015-07-18T07:00:00.000Z"
                    }];

                    expect(referralLocationsRepository.upsert).toHaveBeenCalledWith(expectedPayload);
                });
            });

            describe('excludedDataElements', function () {
                beforeEach(function () {
                    userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1']));
                    dataStoreService.getUpdatedKeys.and.returnValue(utils.getPromise(q, {excludedDataElements: ["mod1", "mod2"]}));
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [{id: "mod1"}]));
                });
                it('should download excluded data elements only relevant to current project ids', function () {
                    consumer.run();
                    scope.$apply();

                    expect(dataStoreService.getExcludedDataElements).toHaveBeenCalledWith(["mod1"]);
                });

                it('should get local excluded data elements', function () {
                    consumer.run();
                    scope.$apply();

                    expect(excludedDataElementsRepository.findAll).toHaveBeenCalledWith(["mod1"]);
                });

                it('should merge based on lastUpdated time', function () {
                    var mockRemoteExcludedDataElements = [{
                        "orgUnit": "opUnit1",
                        "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                    }, {
                        "orgUnit": "opUnit2",
                        "clientLastUpdated": "2015-07-18T07:00:00.000Z"
                    }];

                    var localExcludedDataElements = [{
                        "orgUnit": "opUnit1",
                        "dataElements": [{id: "someId"}],
                        "clientLastUpdated": "2015-07-17T08:00:00.000Z"
                    }];
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [{id: "mod1"}, {id: "mod2"}]));
                    dataStoreService.getExcludedDataElements.and.returnValue(utils.getPromise(q, mockRemoteExcludedDataElements));
                    excludedDataElementsRepository.findAll.and.returnValue(utils.getPromise(q, localExcludedDataElements));
                    consumer.run();
                    scope.$apply();

                    var expectedPayload = [localExcludedDataElements[0], mockRemoteExcludedDataElements[1]];
                    expect(excludedDataElementsRepository.upsert).toHaveBeenCalledWith(expectedPayload);
                });
            });

            it("should download project settings and save patient origin details", function () {
                var userCurrentProjects = ['prj', 'prjWithNoPatientOriginDetails'];
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, userCurrentProjects));

                var projectSettingsFromDhis = {
                    "prjWithNoPatientOriginDetails": {
                        "excludedDataElements": []
                    },
                    "prj": {
                        "excludedDataElements": [],
                        "patientOrigins": [{
                            "orgUnit": "opUnit1",
                            "origins": [{
                                "id": "origin1",
                                "name": "Origin 1",
                                "isDisabled": false,
                                "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                            }],
                        }]
                    }
                };
                systemSettingService.getProjectSettings.and.returnValue(utils.getPromise(q, projectSettingsFromDhis));

                consumer.run();
                scope.$apply();

                var expectedPayload = [{
                    "orgUnit": "opUnit1",
                    "origins": [{
                        "id": "origin1",
                        "name": "Origin 1",
                        "isDisabled": false,
                        "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                    }],
                }];

                expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPayload);
            });

            it("should merge patient origin details with local patient origin details based on clientLastUpdated time", function () {
                var userCurrentProjects = ['prj'];
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, userCurrentProjects));

                var projectSettingsFromDhis = {
                    "prj": {
                        "excludedDataElements": [],
                        "patientOrigins": [{
                            "orgUnit": "opUnit1",
                            "origins": [{
                                "id": "origin1",
                                "name": "Origin 1",
                                "isDisabled": false,
                                "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                            }, {
                                "id": "origin2",
                                "name": "Origin 2",
                                "isDisabled": false,
                                "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                            }]
                        }, {
                            "orgUnit": "opUnit2",
                            "origins": [{
                                "id": "origin3",
                                "name": "Origin 3",
                                "isDisabled": false,
                                "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                            }]
                        }]
                    }
                };

                var patientDetailsFromLocalDb = {
                    "orgUnit": "opUnit1",
                    "origins": [{
                        "id": "origin1",
                        "name": "Origin Name 1",
                        "isDisabled": false,
                        "clientLastUpdated": "2015-07-17T08:00:00.000Z"
                    }]
                };
                systemSettingService.getProjectSettings.and.returnValue(utils.getPromise(q, projectSettingsFromDhis));
                patientOriginRepository.get.and.returnValues(utils.getPromise(q, patientDetailsFromLocalDb), utils.getPromise(q, undefined));

                consumer.run();
                scope.$apply();

                var expectedPayload = [{
                    "orgUnit": "opUnit1",
                    "origins": [{
                        "id": "origin1",
                        "name": "Origin Name 1",
                        "isDisabled": false,
                        "clientLastUpdated": "2015-07-17T08:00:00.000Z"
                    }, {
                        "id": "origin2",
                        "name": "Origin 2",
                        "isDisabled": false,
                        "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                    }]
                }, {
                    "orgUnit": "opUnit2",
                    "origins": [{
                        "id": "origin3",
                        "name": "Origin 3",
                        "isDisabled": false,
                        "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                    }]
                }];

                expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPayload);
                expect(patientOriginRepository.get.calls.argsFor(0)).toEqual(["opUnit1"]);
                expect(patientOriginRepository.get.calls.argsFor(1)).toEqual(["opUnit2"]);
            });

            it("should not fail if current user projects are not available", function () {
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, undefined));

                consumer.run();
                scope.$apply();

                expect(systemSettingService.getProjectSettings).not.toHaveBeenCalled();
                expect(referralLocationsRepository.upsert).not.toHaveBeenCalled();
                expect(patientOriginRepository.upsert).not.toHaveBeenCalled();
                expect(excludedDataElementsRepository.upsert).not.toHaveBeenCalled();
            });

            it('should download and merge excludedLineListOptions for users projects', function () {
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1', 'prj2']));

                consumer.run();
                scope.$apply();

                expect(excludedLinelistOptionsMerger.mergeAndSaveForProject.calls.argsFor(0)).toContain('prj1');
                expect(excludedLinelistOptionsMerger.mergeAndSaveForProject.calls.argsFor(1)).toContain('prj2');
            });
        });
    });
