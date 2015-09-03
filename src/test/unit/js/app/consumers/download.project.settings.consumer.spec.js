define(["angularMocks", "utils", "systemSettingService", "userPreferenceRepository", "referralLocationsRepository", "patientOriginRepository", "mergeBy", "downloadProjectSettingsConsumer"],
    function(mocks, utils, SystemSettingService, UserPreferenceRepository, ReferralLocationsRepository, PatientOriginRepository, MergeBy, DownloadProjectSettingsConsumer) {
        describe("downloadProjectSettingsConsumer", function() {
            var consumer,
                systemSettingService,
                referralLocationsRepository,
                patientOriginRepository,
                orgUnitRepository,
                userPreferenceRepository,
                mergeBy,
                q,
                scope;

            beforeEach(mocks.inject(function($q, $rootScope, $log) {
                var projectSettingsFromDhis = {
                    "prj1": {
                        "excludedDataElements": [{
                            "id": "mod1",
                            "dataElements": ["de1", "de2"],
                            "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                        }],
                        "patientOrigins": [{
                            "orgUnit": "opUnit1",
                            "origins": [{
                                "id": "origin1",
                                "name": "Origin 1",
                                "isDisabled": false
                            }],
                            "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                        }],
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
                    },
                    "prj2": {
                        "excludedDataElements": [],
                        "referralLocations": [{
                            "id": "opUnit1",
                            "facility 1": {
                                "value": "some alias",
                                "isDisabled": true
                            },
                            "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                        }]
                    }
                };

                q = $q;
                mergeBy = new MergeBy($log);
                scope = $rootScope.$new();

                systemSettingService = new SystemSettingService();
                spyOn(systemSettingService, "getProjectSettings").and.returnValue(utils.getPromise(q, {}));

                userPreferenceRepository = new UserPreferenceRepository();
                spyOn(userPreferenceRepository, "getCurrentProjects").and.returnValue(utils.getPromise(q, []));

                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                patientOriginRepository = new PatientOriginRepository();
                spyOn(patientOriginRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                consumer = new DownloadProjectSettingsConsumer(q, systemSettingService, userPreferenceRepository, referralLocationsRepository, patientOriginRepository);
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

            // it("should overwrite local referral locations with dhis copy only when referral locations are newer in dhis", function() {
            //     var localReferralLocations = [{
            //         'id': 'opUnit1',
            //         'clientLastUpdated': '2015-01-01T09:00:00.000+0000',
            //     }, {
            //         'id': 'opUnit2',
            //         'clientLastUpdated': '2015-01-01T09:00:00.000+0000',
            //     }];

            //     var dhisReferralLocations = [{
            //         'id': 'opUnit1',
            //         'clientLastUpdated': '2015-01-01T10:00:00.000+0000',
            //     }, {
            //         'id': 'opUnit2',
            //         'clientLastUpdated': '2015-01-01T08:00:00.000+0000',
            //     }];

            //     var expectedMergedReferralLocations = [
            //         dhisReferralLocations[0],
            //         localReferralLocations[1]
            //     ];

            //     systemSettingService.getReferralLocations.and.returnValue(utils.getPromise(q, dhisReferralLocations));
            //     referralLocationsRepository.findAll.and.returnValue(utils.getPromise(q, localReferralLocations));

            //     consumer.run();
            //     scope.$apply();

            //     expect(referralLocationsRepository.upsert).toHaveBeenCalledWith(expectedMergedReferralLocations);
            // });

            // it("should merge patient origin details", function() {
            //     var localOriginDetails = [{
            //             orgUnit: "prj1",
            //             origins: [{
            //                 'id': 'origin3',
            //                 'name': 'origin3',
            //                 'latitude': '80',
            //                 'longitude': '180',
            //                 'clientLastUpdated': "2014-06-01T12:50:54.972Z",
            //             }]
            //         }, {
            //             orgUnit: "prj2",
            //             origins: [{
            //                 'id': 'origin4',
            //                 'name': 'Neworigin4',
            //                 'latitude': '10',
            //                 'longitude': '5',
            //                 'clientLastUpdated': "2014-05-31T12:43:54.972Z"
            //             }]
            //         }

            //     ];

            //     spyOn(patientOriginService, "getAll").and.returnValue(utils.getPromise(q, dhisPatientOriginDetails));
            //     spyOn(patientOriginRepository, "upsert");
            //     spyOn(patientOriginRepository, "findAll").and.returnValue(utils.getPromise(q, localOriginDetails));

            //     downloadPatientOriginConsumer = new DownloadPatientOriginConsumer(patientOriginService, patientOriginRepository, mergeBy);
            //     downloadPatientOriginConsumer.run();

            //     scope.$apply();

            //     expect(patientOriginService.getAll).toHaveBeenCalled();

            //     var expectedUpserts = [{
            //         orgUnit: "prj1",
            //         origins: [{
            //             'id': 'origin1',
            //             'name': 'origin1',
            //             'latitude': '80',
            //             'longitude': '180',
            //             'clientLastUpdated': "2014-05-30T12:43:54.972Z"

            //         }, {
            //             'id': 'origin3',
            //             'name': 'origin3',
            //             'latitude': '80',
            //             'longitude': '180',
            //             'clientLastUpdated': "2014-06-01T12:50:54.972Z",
            //         }]
            //     }, {
            //         orgUnit: "prj2",
            //         origins: [{
            //             'id': 'origin4',
            //             'name': 'Neworigin4',
            //             'latitude': '10',
            //             'longitude': '5',
            //             'clientLastUpdated': "2014-05-31T12:43:54.972Z"
            //         }]
            //     }];

            //     expect(patientOriginService.getAll).toHaveBeenCalled();
            //     expect(patientOriginRepository.upsert.calls.argsFor(0)).toEqual([expectedUpserts[0]]);
            //     expect(patientOriginRepository.upsert.calls.argsFor(1)).toEqual([expectedUpserts[1]]);
            // });

            it("should not fail if current user projects are not available", function() {
                userPreferenceRepository.getCurrentProjects.and.returnValue(utils.getPromise(q, undefined));

                consumer.run();
                scope.$apply();

                expect(systemSettingService.getProjectSettings).not.toHaveBeenCalled();
                expect(referralLocationsRepository.upsert).not.toHaveBeenCalled();
            });
        });
    });
