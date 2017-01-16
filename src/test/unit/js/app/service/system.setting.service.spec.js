define(["systemSettingService", "angularMocks", "utils", "dhisUrl"], function(SystemSettingService, mocks, utils, dhisUrl) {
    describe("systemSettingService", function() {

        var http, httpBackend, service, q;

        beforeEach(mocks.inject(function($httpBackend, $http) {
            http = $http;
            httpBackend = $httpBackend;
            service = new SystemSettingService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should get system settings", function() {
            var systemSettingsFromDhis = {
                fieldAppSettings: {
                    moduleTemplates: {
                        'ds1': {}
                    },
                    anotherSetting: "foo"
                },
                versionCompatibilityInfo: {
                    compatiblePraxisVersions: [
                        '5.0',
                        '6.0'
                    ]
                },
                "notificationSetting": {
                    notificationSetting: '1.5'
                }
            };

            httpBackend.expectGET(dhisUrl.systemSettings + "?key=fieldAppSettings,versionCompatibilityInfo,notificationSetting").respond(200, systemSettingsFromDhis);

            var actualResult;
            service.getSystemSettings().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            var expectedSystemSettings = [{
                "key": "moduleTemplates",
                "value": {
                    "ds1": {}
                }
            }, {
                "key": "anotherSetting",
                "value": "foo"
            }, {
                "key": "compatiblePraxisVersions",
                "value":["5.0", "6.0"]
            }, {
                "key": "notificationSetting",
                "value": "1.5"
            },];

            expect(actualResult).toEqual(expectedSystemSettings);
        });

        it("should load pre-packaged system settings", function() {
            var systemSettingsFromFile = {
                "fieldAppSettings": {
                    "moduleTemplates": {
                        "ds1": {}
                    },
                    "anotherSetting": "foo"
                }
            };

            httpBackend.expectGET("data/systemSettings.json").respond(200, systemSettingsFromFile);

            var actualResult;
            service.loadFromFile().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            expectedSystemSettings = [{
                "key": "moduleTemplates",
                "value": {
                    "ds1": {}
                }
            }, {
                "key": "anotherSetting",
                "value": "foo"
            }];

            expect(actualResult).toEqual(expectedSystemSettings);
        });

        it("should return empty system settings if local file does not exist", function() {
            httpBackend.expectGET("data/systemSettings.json").respond(404);

            var actualResult;
            service.loadFromFile().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            expect(actualResult).toEqual([]);
        });

        it("should get project settings", function() {
            var projectSettingsFromDhis = {
                "projectSettings_prj1": {
                    "excludedDataElements": [{
                        "orgUnit": "mod1",
                        "dataElements": [{
                            "id": "de1"
                        }, {
                            "id": "de2"
                        }],
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
                },
                "projectSettings_prj2": {
                    "excludedDataElements": [],
                    "referralLocations": [{
                        "orgUnit": "opUnit1",
                        "facility 1": {
                            "value": "some alias",
                            "isDisabled": true
                        },
                        "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                    }]
                }
            };

            var expectedResult = {
                "prj1": {
                    "excludedDataElements": [{
                        "orgUnit": "mod1",
                        "dataElements": [{
                            "id": "de1"
                        }, {
                            "id": "de2"
                        }],
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
                },
                "prj2": {
                    "excludedDataElements": [],
                    "referralLocations": [{
                        "orgUnit": "opUnit1",
                        "facility 1": {
                            "value": "some alias",
                            "isDisabled": true
                        },
                        "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                    }]
                }
            };

            httpBackend.expectGET(dhisUrl.systemSettings + "?key=projectSettings_prj1&key=projectSettings_prj2").respond(200, projectSettingsFromDhis);

            var actualResult;
            service.getProjectSettings(["prj1", "prj2"]).then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            expect(actualResult).toEqual(expectedResult);
        });

        describe("upsertExcludedDataElements", function() {
            it("should insert excludedDataElements when upserting", function() {
                var projectSettingsFromDhis = {};

                var excludedDataElementsToUpsert = {
                    "orgUnit": "mod1",
                    "dataElements": [{
                        "id": "de1"
                    }, {
                        "id": "de2"
                    }],
                    "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                };

                var expectedPayload = {
                    "projectSettings_prj1": {
                        "excludedDataElements": [{
                            "orgUnit": "mod1",
                            "dataElements": [{
                                "id": "de1"
                            }, {
                                "id": "de2"
                            }],
                            "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                        }]
                    }
                };

                httpBackend.expectGET(dhisUrl.systemSettings + "?key=projectSettings_prj1").respond(200, projectSettingsFromDhis);
                httpBackend.expectPOST(dhisUrl.systemSettings, expectedPayload).respond(200, "ok");

                service.upsertExcludedDataElements("prj1", excludedDataElementsToUpsert);
                httpBackend.flush();
            });

            it("should append excludedDataElements when upserting", function() {
                var projectSettingsFromDhis = {
                    "projectSettings_prj1": {
                        "excludedDataElements": [{
                            "orgUnit": "mod1",
                            "dataElements": [{
                                "id": "de1"
                            }, {
                                "id": "de2"
                            }],
                            "clientLastUpdated": "2014-01-01T12:00:00.000Z"
                        }],
                        "otherSettings": "blah"
                    }
                };

                var excludedDataElementsToUpsert = {
                    "orgUnit": "mod2",
                    "dataElements": [{
                        "id": "de3"
                    }, {
                        "id": "de4"
                    }],
                    "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                };

                var expectedPayload = {
                    "projectSettings_prj1": {
                        "excludedDataElements": [{
                            "orgUnit": "mod1",
                            "dataElements": [{
                                "id": "de1"
                            }, {
                                "id": "de2"
                            }],
                            "clientLastUpdated": "2014-01-01T12:00:00.000Z"
                        }, {
                            "orgUnit": "mod2",
                            "dataElements": [{
                                "id": "de3"
                            }, {
                                "id": "de4"
                            }],
                            "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                        }],
                        "otherSettings": "blah"
                    }
                };

                httpBackend.expectGET(dhisUrl.systemSettings + "?key=projectSettings_prj1").respond(200, projectSettingsFromDhis);
                httpBackend.expectPOST(dhisUrl.systemSettings, expectedPayload).respond(200, "ok");

                service.upsertExcludedDataElements("prj1", excludedDataElementsToUpsert);
                httpBackend.flush();
            });

            it("should update excludedDataElements when upserting", function() {
                var projectSettingsFromDhis = {
                    "projectSettings_prj1": {
                        "excludedDataElements": [{
                            "orgUnit": "mod1",
                            "dataElements": [{
                                "id": "de1"
                            }, {
                                "id": "de2"
                            }],
                            "clientLastUpdated": "2014-01-01T12:00:00.000Z"
                        }],
                        "otherSettings": "blah"
                    }
                };

                var excludedDataElementsToUpsert = {
                    "orgUnit": "mod1",
                    "dataElements": [{
                        "id": "de1"
                    }, {
                        "id": "de2"
                    }, {
                        "id": "de3"
                    }, {
                        "id": "de4"
                    }],
                    "clientLastUpdated": "2015-01-10T12:00:00.000Z"
                };

                var expectedPayload = {
                    "projectSettings_prj1": {
                        "excludedDataElements": [{
                            "orgUnit": "mod1",
                            "dataElements": [{
                                "id": "de1"
                            }, {
                                "id": "de2"
                            }, {
                                "id": "de3"
                            }, {
                                "id": "de4"
                            }],
                            "clientLastUpdated": "2015-01-10T12:00:00.000Z"
                        }],
                        "otherSettings": "blah"
                    }
                };

                httpBackend.expectGET(dhisUrl.systemSettings + "?key=projectSettings_prj1").respond(200, projectSettingsFromDhis);
                httpBackend.expectPOST(dhisUrl.systemSettings, expectedPayload).respond(200, "ok");

                service.upsertExcludedDataElements("prj1", excludedDataElementsToUpsert);
                httpBackend.flush();
            });
        });

        describe("upsertPatientOriginDetails", function() {
            it("should insert patientOriginDetails when upserting", function() {
                var projectSettingsFromDhis = {};

                var patientOriginDetailsToUpsert = {
                    "orgUnit": "opUnit1",
                    "origins": [{
                        "id": "origin1",
                        "name": "Origin 1",
                        "isDisabled": false
                    }],
                    "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                };

                var expectedPayload = {
                    "projectSettings_prj1": {
                        "patientOrigins": [{
                            "orgUnit": "opUnit1",
                            "origins": [{
                                "id": "origin1",
                                "name": "Origin 1",
                                "isDisabled": false
                            }],
                            "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                        }]
                    }
                };

                httpBackend.expectGET(dhisUrl.systemSettings + "?key=projectSettings_prj1").respond(200, projectSettingsFromDhis);
                httpBackend.expectPOST(dhisUrl.systemSettings, expectedPayload).respond(200, "ok");

                service.upsertPatientOriginDetails("prj1", patientOriginDetailsToUpsert);
                httpBackend.flush();
            });

            it("should append patientOriginDetails when upserting", function() {
                var projectSettingsFromDhis = {
                    "projectSettings_prj1": {
                        "patientOrigins": [{
                            "orgUnit": "opUnit1",
                            "origins": [{
                                "id": "origin1",
                                "name": "Origin 1",
                                "isDisabled": false
                            }],
                            "clientLastUpdated": "2014-01-01T12:00:00.000Z"
                        }],
                        "otherSettings": "blah"
                    }
                };

                var patientOriginDetailsToUpsert = {
                    "orgUnit": "opUnit2",
                    "origins": [{
                        "id": "origin2",
                        "name": "Origin 2",
                        "isDisabled": false
                    }],
                    "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                };

                var expectedPayload = {
                    "projectSettings_prj1": {
                        "patientOrigins": [{
                            "orgUnit": "opUnit1",
                            "origins": [{
                                "id": "origin1",
                                "name": "Origin 1",
                                "isDisabled": false
                            }],
                            "clientLastUpdated": "2014-01-01T12:00:00.000Z"
                        }, {
                            "orgUnit": "opUnit2",
                            "origins": [{
                                "id": "origin2",
                                "name": "Origin 2",
                                "isDisabled": false
                            }],
                            "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                        }],
                        "otherSettings": "blah"
                    }
                };

                httpBackend.expectGET(dhisUrl.systemSettings + "?key=projectSettings_prj1").respond(200, projectSettingsFromDhis);
                httpBackend.expectPOST(dhisUrl.systemSettings, expectedPayload).respond(200, "ok");

                service.upsertPatientOriginDetails("prj1", patientOriginDetailsToUpsert);
                httpBackend.flush();
            });

            it("should update patientOriginDetails when upserting", function() {
                var projectSettingsFromDhis = {
                    "projectSettings_prj1": {
                        "patientOrigins": [{
                            "orgUnit": "opUnit1",
                            "origins": [{
                                "id": "origin1",
                                "name": "Origin 1",
                                "isDisabled": false
                            }],
                            "clientLastUpdated": "2014-01-01T12:00:00.000Z"
                        }],
                        "otherSettings": "blah"
                    }
                };

                var patientOriginDetailsToUpsert = {
                    "orgUnit": "opUnit1",
                    "origins": [{
                        "id": "origin2",
                        "name": "Origin 2",
                        "isDisabled": false
                    }],
                    "clientLastUpdated": "2014-01-10T12:00:00.000Z"
                };

                var expectedPayload = {
                    "projectSettings_prj1": {
                        "patientOrigins": [{
                            "orgUnit": "opUnit1",
                            "origins": [{
                                "id": "origin2",
                                "name": "Origin 2",
                                "isDisabled": false
                            }],
                            "clientLastUpdated": "2014-01-10T12:00:00.000Z"
                        }],
                        "otherSettings": "blah"
                    }
                };

                httpBackend.expectGET(dhisUrl.systemSettings + "?key=projectSettings_prj1").respond(200, projectSettingsFromDhis);
                httpBackend.expectPOST(dhisUrl.systemSettings, expectedPayload).respond(200, "ok");

                service.upsertPatientOriginDetails("prj1", patientOriginDetailsToUpsert);
                httpBackend.flush();
            });
        });

        describe("upsertReferralLocations", function() {
            it("should insert referralLocations when upserting", function() {
                var projectSettingsFromDhis = {};

                var referralLocationsToUpsert = {
                    "orgUnit": "opUnit1",
                    "facility 1": {
                        "value": "some alias",
                        "isDisabled": true
                    },
                    "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                };

                var expectedPayload = {
                    "projectSettings_prj1": {
                        "referralLocations": [{
                            "orgUnit": "opUnit1",
                            "facility 1": {
                                "value": "some alias",
                                "isDisabled": true
                            },
                            "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                        }]
                    }
                };

                httpBackend.expectGET(dhisUrl.systemSettings + "?key=projectSettings_prj1").respond(200, projectSettingsFromDhis);
                httpBackend.expectPOST(dhisUrl.systemSettings, expectedPayload).respond(200, "ok");

                service.upsertReferralLocations("prj1", referralLocationsToUpsert);
                httpBackend.flush();
            });

            it("should append referralLocations when upserting", function() {
                var projectSettingsFromDhis = {
                    "projectSettings_prj1": {
                        "referralLocations": [{
                            "orgUnit": "opUnit1",
                            "facility 1": {
                                "value": "some alias",
                                "isDisabled": true
                            },
                            "clientLastUpdated": "2014-01-01T12:00:00.000Z"
                        }]
                    }
                };

                var referralLocationsToUpsert = {
                    "orgUnit": "opUnit2",
                    "facility 1": {
                        "value": "some other alias"
                    },
                    "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                };

                var expectedPayload = {
                    "projectSettings_prj1": {
                        "referralLocations": [{
                            "orgUnit": "opUnit1",
                            "facility 1": {
                                "value": "some alias",
                                "isDisabled": true
                            },
                            "clientLastUpdated": "2014-01-01T12:00:00.000Z"
                        }, {
                            "orgUnit": "opUnit2",
                            "facility 1": {
                                "value": "some other alias"
                            },
                            "clientLastUpdated": "2014-05-30T12:00:00.000Z"
                        }]
                    }
                };

                httpBackend.expectGET(dhisUrl.systemSettings + "?key=projectSettings_prj1").respond(200, projectSettingsFromDhis);
                httpBackend.expectPOST(dhisUrl.systemSettings, expectedPayload).respond(200, "ok");

                service.upsertReferralLocations("prj1", referralLocationsToUpsert);
                httpBackend.flush();
            });

            it("should update referralLocations when upserting", function() {
                var projectSettingsFromDhis = {
                    "projectSettings_prj1": {
                        "referralLocations": [{
                            "orgUnit": "opUnit1",
                            "facility 1": {
                                "value": "some alias",
                                "isDisabled": true
                            },
                            "clientLastUpdated": "2014-01-01T12:00:00.000Z"
                        }]
                    }
                };

                var referralLocationsToUpsert = {
                    "orgUnit": "opUnit1",
                    "facility 1": {
                        "value": "some other alias"
                    },
                    "clientLastUpdated": "2014-01-10T12:00:00.000Z"
                };

                var expectedPayload = {
                    "projectSettings_prj1": {
                        "referralLocations": [{
                            "orgUnit": "opUnit1",
                            "facility 1": {
                                "value": "some other alias"
                            },
                            "clientLastUpdated": "2014-01-10T12:00:00.000Z"
                        }]
                    }
                };

                httpBackend.expectGET(dhisUrl.systemSettings + "?key=projectSettings_prj1").respond(200, projectSettingsFromDhis);
                httpBackend.expectPOST(dhisUrl.systemSettings, expectedPayload).respond(200, "ok");

                service.upsertReferralLocations("prj1", referralLocationsToUpsert);
                httpBackend.flush();
            });
        });


    });
});
