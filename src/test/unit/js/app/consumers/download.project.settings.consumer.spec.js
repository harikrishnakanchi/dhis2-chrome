define(["angularMocks", "utils", "systemSettingService", "userPreferenceRepository", "referralLocationsRepository", "patientOriginRepository", "excludedDataElementsRepository", "downloadProjectSettingsConsumer", "mergeBy", "changeLogRepository", "dataStoreService", "orgUnitRepository", "systemInfoService", "excludedLineListOptionsRepository"],
    function (mocks, utils, SystemSettingService, UserPreferenceRepository, ReferralLocationsRepository, PatientOriginRepository, ExcludedDataElementsRepository, DownloadProjectSettingsConsumer, MergeBy, ChangeLogRepository, DataStoreService, OrgUnitRepository, SystemInfoService, ExcludedLineListOptionsRepository) {
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
                changeLogRepository,
                dataStoreService,
                systemInfoService,
                excludedLineListOptionsRepository;

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
                spyOn(patientOriginRepository, "findAll").and.returnValue(utils.getPromise(q, {}));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(excludedDataElementsRepository, "findAll").and.returnValue(utils.getPromise(q, []));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, "2017-05-01T19:10:13.677Z"));
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, ""));

                dataStoreService = new DataStoreService({});
                spyOn(dataStoreService, "getUpdatedData").and.returnValue(utils.getPromise(q, {}));
                spyOn(dataStoreService, "getReferrals").and.returnValue(utils.getPromise(q, []));
                spyOn(dataStoreService, "getExcludedDataElements").and.returnValue(utils.getPromise(q, []));
                spyOn(dataStoreService, "getPatientOrigins").and.returnValue(utils.getPromise(q, []));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, 'getAllOpUnitsInOrgUnits').and.returnValue(utils.getPromise(q, []));

                systemInfoService = new SystemInfoService();
                spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, 'someTime'));

                excludedLineListOptionsRepository = new ExcludedLineListOptionsRepository();
                spyOn(excludedLineListOptionsRepository, "findAll").and.returnValue(utils.getPromise(q, []));
                spyOn(excludedLineListOptionsRepository, "upsert").and.returnValue(utils.getPromise(q, []));

                mergeBy = new MergeBy($log);

                consumer = new DownloadProjectSettingsConsumer(q, systemInfoService, userPreferenceRepository, referralLocationsRepository, patientOriginRepository, excludedDataElementsRepository, mergeBy, changeLogRepository, dataStoreService, orgUnitRepository, excludedLineListOptionsRepository);
            }));

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

                expect(dataStoreService.getUpdatedData).toHaveBeenCalledWith(['prj1', 'prj2'], "2017-05-01T15:10:13.677Z");
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
                    dataStoreService.getUpdatedData.and.returnValue(utils.getPromise(q, {referralLocations: ["opUnit1", "opUnit2"]}));
                    orgUnitRepository.getAllOpUnitsInOrgUnits.and.returnValue(utils.getPromise(q, [{id: "opUnit1"}, {id: "opUnit3"}]));
                });

                it('should get local referral locations only relevant to current project ids', function () {
                    consumer.run();
                    scope.$apply();

                    expect(referralLocationsRepository.findAll).toHaveBeenCalledWith(["opUnit1", "opUnit3"]);
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
                    dataStoreService.getUpdatedData.and.returnValue(utils.getPromise(q, {referralLocations: mockRemoteReferrals}));
                    orgUnitRepository.getAllOpUnitsInOrgUnits.and.returnValue(utils.getPromise(q, [{id: "opUnit1"}, {id: "opUnit2"}]));
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
                    dataStoreService.getUpdatedData.and.returnValue(utils.getPromise(q, {excludedDataElements: ["mod1", "mod2"]}));
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [{id: "mod1"}, {id: "mod2"}]));
                });

                it('should get local excluded data elements', function () {
                    consumer.run();
                    scope.$apply();

                    expect(excludedDataElementsRepository.findAll).toHaveBeenCalledWith(["mod1", "mod2"]);
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
                    dataStoreService.getUpdatedData.and.returnValue(utils.getPromise(q, {excludedDataElements: mockRemoteExcludedDataElements}));
                    excludedDataElementsRepository.findAll.and.returnValue(utils.getPromise(q, localExcludedDataElements));
                    consumer.run();
                    scope.$apply();

                    var expectedPayload = [localExcludedDataElements[0], mockRemoteExcludedDataElements[1]];
                    expect(excludedDataElementsRepository.upsert).toHaveBeenCalledWith(expectedPayload);
                });
            });

            describe('patientOrigins', function () {
                beforeEach(function () {
                    userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1']));
                    dataStoreService.getUpdatedData.and.returnValue(utils.getPromise(q, {patientOrigins: ["opUnit1", "opUnit2"]}));
                    orgUnitRepository.getAllOpUnitsInOrgUnits.and.returnValue(utils.getPromise(q, [{id: "opUnit1"}, {id: "opUnit3"}]));
                });

                it('should get local patient origins', function () {
                    consumer.run();
                    scope.$apply();

                    expect(patientOriginRepository.findAll).toHaveBeenCalledWith(["opUnit1", "opUnit3"]);
                });

                it('should merge patient origins based on lastUpdated time', function () {
                    var mockRemotePatientOrigins = [{
                        "orgUnit": "opUnit1",
                        "origins": [{
                            "id": "origin1",
                            "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                        }, {
                            "id": "origin2",
                            "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                        }]
                    }, {
                        "orgUnit": "opUnit2",
                        "origins": [{
                            "id": "origin3",
                            "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                        }]
                    }];

                    var mockLocalPatientOrigins = [{
                        "orgUnit": "opUnit1",
                        "origins": [{
                            "id": "origin1",
                            "clientLastUpdated": "2015-07-17T08:00:00.000Z"
                        }]
                    }];
                    patientOriginRepository.findAll.and.returnValue(utils.getPromise(q, mockLocalPatientOrigins));
                    dataStoreService.getUpdatedData.and.returnValue(utils.getPromise(q, {patientOrigins: mockRemotePatientOrigins}));

                    consumer.run();
                    scope.$apply();

                    var expectedPayload = [{
                        "orgUnit": "opUnit1",
                        "origins": [{
                            "id": "origin1",
                            "clientLastUpdated": "2015-07-17T08:00:00.000Z"
                        }, {
                            "id": "origin2",
                            "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                        }]
                    }, mockRemotePatientOrigins[1]];

                    expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPayload);
                });
            });

            describe('excludedOptions', function () {
                beforeEach(function () {
                    userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1']));
                    dataStoreService.getUpdatedData.and.returnValue(utils.getPromise(q, {excludedOptions: ["mod1", "mod2"]}));
                    orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, [{id: "mod1"}, {id: "mod2"}]));
                });

                it('should get local excluded options', function () {
                    consumer.run();
                    scope.$apply();

                    expect(excludedLineListOptionsRepository.findAll).toHaveBeenCalledWith(["mod1", "mod2"]);
                });

                it('should merge based on lastUpdated time', function () {
                    var remoteExcludedOptions = [{
                        moduleId: "mod1",
                        clientLastUpdated: "2015-07-17T07:00:00.000Z",
                        dataElements: []
                    }, {
                        moduleId: "mod2",
                        clientLastUpdated: "2015-07-17T07:20:00.000Z",
                        dataElements: []
                    }];
                    var localExcludedOptions = [{
                        moduleId: "mod1",
                        clientLastUpdated: "2015-07-17T07:30:00.000Z",
                        dataElements: [{id: "someId"}]
                    }];
                    dataStoreService.getUpdatedData.and.returnValue(utils.getPromise(q, {excludedOptions: remoteExcludedOptions}));
                    excludedLineListOptionsRepository.findAll.and.returnValue(utils.getPromise(q, localExcludedOptions));
                    consumer.run();
                    scope.$apply();

                    var expectedPayload = [localExcludedOptions[0], remoteExcludedOptions[1]];
                    expect(excludedLineListOptionsRepository.upsert).toHaveBeenCalledWith(expectedPayload);
                });
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

            it('should get server date from system info', function () {
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1']));

                consumer.run();
                scope.$apply();

                expect(systemInfoService.getServerDate).toHaveBeenCalled();
            });

            it('should update the changeLog for all projectIds', function () {
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, ['prj1', 'prj2']));

                consumer.run();
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith("projectSettings:prj1", "someTime");
                expect(changeLogRepository.upsert).toHaveBeenCalledWith("projectSettings:prj2", "someTime");
            });
        });
    });
