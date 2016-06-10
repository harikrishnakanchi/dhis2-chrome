define(["angularMocks", "utils", "systemSettingService", "userPreferenceRepository", "referralLocationsRepository", "patientOriginRepository", "excludedDataElementsRepository", "downloadProjectSettingsConsumer", "mergeBy"],
    function(mocks, utils, SystemSettingService, UserPreferenceRepository, ReferralLocationsRepository, PatientOriginRepository, ExcludedDataElementsRepository, DownloadProjectSettingsConsumer, MergeBy) {
        describe("downloadProjectSettingsConsumer", function() {
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
                message;

            beforeEach(mocks.inject(function($q, $rootScope, $log) {

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

                mergeBy = new MergeBy($log);

                message = {data: {data: []}};

                consumer = new DownloadProjectSettingsConsumer(q, systemSettingService, userPreferenceRepository, referralLocationsRepository, patientOriginRepository, excludedDataElementsRepository, mergeBy);
            }));

            it("should download project settings for specified projects", function() {
                message.data.data =  ['prj1', 'prj2'];

                consumer.run(message);
                scope.$apply();

                expect(systemSettingService.getProjectSettings).toHaveBeenCalledWith(['prj1', 'prj2']);
            });

            it("should download project settings and save referral locations", function() {
                message.data.data = ['prj', 'prjWithNoReferralLocations'];

                var projectSettingsFromDhis = {
                    "prjWithNoReferralLocations": {
                        "excludedDataElements": []
                    },
                    "prj": {
                        "excludedDataElements": [],
                        "referralLocations": [{
                            "orgUnit": "opUnit1",
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
                var refferalLocationFromLocalDb = [];

                referralLocationsRepository.findAll.and.returnValue(utils.getPromise(q, refferalLocationFromLocalDb));
                systemSettingService.getProjectSettings.and.returnValue(utils.getPromise(q, projectSettingsFromDhis));

                consumer.run(message);
                scope.$apply();

                var expectedPayload = [{
                    "orgUnit": "opUnit1",
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

            it("should merge referral locations based on clientLastUpdated time", function() {
                message.data.data = ['prj', 'prjWithNoReferralLocations'];

                var projectSettingsFromDhis = {
                    "prjWithNoReferralLocations": {
                        "excludedDataElements": []
                    },
                    "prj": {
                        "excludedDataElements": [],
                        "referralLocations": [{
                            "orgUnit": "opUnit1",
                            "facility 1": {
                                "value": "some alias",
                                "isDisabled": true
                            },
                            "facility 2": {
                                "value": "some other alias"
                            },
                            "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                        }, {
                            "orgUnit": "opUnit2",
                            "facility 1": {
                                "value": "some alias2",
                                "isDisabled": false
                            },
                            "facility 2": {
                                "value": "some other alias 2"
                            },
                            "clientLastUpdated": "2015-07-19T07:00:00.000Z"
                        }]
                    }
                };

                var refferalLocationFromLocalDb = [{
                    "orgUnit": "opUnit1",
                    "facility 1": {
                        "value": "some alias",
                        "isDisabled": true
                    },
                    "facility 2": {
                        "value": "some other local alias"
                    },
                    "clientLastUpdated": "2015-07-17T08:00:00.000Z"
                }];

                referralLocationsRepository.findAll.and.returnValue(utils.getPromise(q, refferalLocationFromLocalDb));
                systemSettingService.getProjectSettings.and.returnValue(utils.getPromise(q, projectSettingsFromDhis));

                consumer.run(message);
                scope.$apply();

                var expectedPayload = [{
                    "orgUnit": "opUnit1",
                    "facility 1": {
                        "value": "some alias",
                        "isDisabled": true
                    },
                    "facility 2": {
                        "value": "some other local alias"
                    },
                    "clientLastUpdated": "2015-07-17T08:00:00.000Z"
                }, {
                    "orgUnit": "opUnit2",
                    "facility 1": {
                        "value": "some alias2",
                        "isDisabled": false
                    },
                    "facility 2": {
                        "value": "some other alias 2"
                    },
                    "clientLastUpdated": "2015-07-19T07:00:00.000Z"
                }];

                expect(referralLocationsRepository.findAll).toHaveBeenCalledWith(["opUnit1", "opUnit2"]);
                expect(referralLocationsRepository.upsert).toHaveBeenCalledWith(expectedPayload);
            });

            it("should download project settings and save patient origin details", function() {
                message.data.data = ['prj', 'prjWithNoPatientOriginDetails'];

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

                consumer.run(message);
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

            it("should merge patient origin details with local patient origin details based on clientLastUpdated time", function() {
                message.data.data = ['prj'];

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

                consumer.run(message);
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

            it("should download project settings and save excluded data element details", function() {
                message.data.data = ['prj', 'prjWithNoExcludedDataElements'];

                var projectSettingsFromDhis = {
                    "prjWithNoExcludedDataElements": {
                        "patientOrigins": []
                    },
                    "prj": {
                        "excludedDataElements": [{
                            "orgUnit": "mod1",
                            "dataElements": [{
                                "id": "de1"
                            }, {
                                "id": "de2"
                            }],
                            "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                        }],
                        "patientOrigins": []
                    }
                };
                systemSettingService.getProjectSettings.and.returnValue(utils.getPromise(q, projectSettingsFromDhis));

                consumer.run(message);
                scope.$apply();

                var expectedPayload = [{
                    "orgUnit": "mod1",
                    "dataElements": [{
                        "id": "de1"
                    }, {
                        "id": "de2"
                    }],
                    "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                }];

                expect(excludedDataElementsRepository.upsert).toHaveBeenCalledWith(expectedPayload);
            });

            it("should not download project settings or fail, if no projectIds were specified in job and no last login user", function() {
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, []));

                consumer.run(message);
                scope.$apply();

                expect(systemSettingService.getProjectSettings).not.toHaveBeenCalled();
                expect(referralLocationsRepository.upsert).not.toHaveBeenCalled();
                expect(patientOriginRepository.upsert).not.toHaveBeenCalled();
                expect(excludedDataElementsRepository.upsert).not.toHaveBeenCalled();
            });

            it('should get current user project ids if no projects were specified', function() {
                var currentUserProjectIds = ["project1", "project2"];
                userPreferenceRepository.getCurrentUsersProjectIds.and.returnValue(utils.getPromise(q, currentUserProjectIds));

                consumer.run(message);
                scope.$apply();
                expect(systemSettingService.getProjectSettings).toHaveBeenCalledWith(currentUserProjectIds);
            });

        });
    });
