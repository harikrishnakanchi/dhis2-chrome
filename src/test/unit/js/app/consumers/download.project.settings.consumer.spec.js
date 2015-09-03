define(["angularMocks", "utils", "systemSettingService", "userPreferenceRepository", "referralLocationsRepository", "patientOriginRepository", "excludedDataElementsRepository", "downloadProjectSettingsConsumer"],
    function(mocks, utils, SystemSettingService, UserPreferenceRepository, ReferralLocationsRepository, PatientOriginRepository, ExcludedDataElementsRepository, DownloadProjectSettingsConsumer) {
        describe("downloadProjectSettingsConsumer", function() {
            var consumer,
                systemSettingService,
                referralLocationsRepository,
                patientOriginRepository,
                orgUnitRepository,
                userPreferenceRepository,
                excludedDataElementsRepository,
                q,
                scope;

            beforeEach(mocks.inject(function($q, $rootScope, $log) {

                q = $q;
                scope = $rootScope.$new();

                systemSettingService = new SystemSettingService();
                spyOn(systemSettingService, "getProjectSettings").and.returnValue(utils.getPromise(q, {}));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, "getCurrentProjects").and.returnValue(utils.getPromise(q, []));

                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                patientOriginRepository = new PatientOriginRepository();
                spyOn(patientOriginRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                consumer = new DownloadProjectSettingsConsumer(q, systemSettingService, userPreferenceRepository, referralLocationsRepository, patientOriginRepository, excludedDataElementsRepository);
            }));

            it("should download project settings for current user projects", function() {
                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, ['prj1', 'prj2']));

                consumer.run();
                scope.$apply();

                expect(systemSettingService.getProjectSettings).toHaveBeenCalledWith(['prj1', 'prj2']);
            });

            it("should download project settings and save referral locations", function() {
                var userCurrentProjects = ['prj', 'prjWithNoReferralLocations'];
                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, userCurrentProjects));

                var projectSettingsFromDhis = {
                    "prjWithNoReferralLocations": {
                        "excludedDataElements": []
                    },
                    "prj": {
                        "excludedDataElements": [],
                        "referralLocations": [{
                            "id": "opUnit1",
                            "facility 1": {
                                "value": "some alias",
                                "isDisabled": true
                            },
                            "facility 2": {
                                "value": "some other alias"
                            },
                            "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                        }]
                    }
                };
                systemSettingService.getProjectSettings.and.returnValue(utils.getPromise(q, projectSettingsFromDhis));

                consumer.run();
                scope.$apply();

                var expectedPayload = [{
                    "id": "opUnit1",
                    "facility 1": {
                        "value": "some alias",
                        "isDisabled": true
                    },
                    "facility 2": {
                        "value": "some other alias"
                    },
                    "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                }];

                expect(referralLocationsRepository.upsert).toHaveBeenCalledWith(expectedPayload);
            });

            it("should download project settings and save patient origin details", function() {
                var userCurrentProjects = ['prj', 'prjWithNoPatientOriginDetails'];
                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, userCurrentProjects));

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

            it("should download project settings and save excluded data element details", function() {
                var userCurrentProjects = ['prj', 'prjWithNoExcludedDataElements'];
                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, userCurrentProjects));

                var projectSettingsFromDhis = {
                    "prjWithNoExcludedDataElements": {
                        "patientOrigins": []
                    },
                    "prj": {
                        "excludedDataElements": [{
                            "id": "mod1",
                            "dataElements": ["de1", "de2"],
                            "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                        }],
                        "patientOrigins": []
                    }
                };
                systemSettingService.getProjectSettings.and.returnValue(utils.getPromise(q, projectSettingsFromDhis));

                consumer.run();
                scope.$apply();

                var expectedPayload = [{
                    "id": "mod1",
                    "dataElements": ["de1", "de2"],
                    "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                }];

                expect(excludedDataElementsRepository.upsert).toHaveBeenCalledWith(expectedPayload);
            });

            it("should not fail if current user projects are not available", function() {
                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, undefined));

                consumer.run();
                scope.$apply();

                expect(systemSettingService.getProjectSettings).not.toHaveBeenCalled();
                expect(referralLocationsRepository.upsert).not.toHaveBeenCalled();
                expect(patientOriginRepository.upsert).not.toHaveBeenCalled();
                expect(excludedDataElementsRepository.upsert).not.toHaveBeenCalled();
            });
        });
    });
