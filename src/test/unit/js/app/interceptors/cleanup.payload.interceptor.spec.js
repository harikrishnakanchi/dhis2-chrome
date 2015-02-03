define(["cleanupPayloadInterceptor", "angularMocks", "moment"], function(CleanupPayloadInterceptor, mocks, moment) {
    describe("cleanupPayloadInterceptor", function() {
        var cleanupPayloadInterceptor;

        beforeEach(mocks.inject(function() {
            cleanupPayloadInterceptor = new CleanupPayloadInterceptor();
        }));


        it("should remove last updated from non-array based POST http request payload", function() {
            var openingDate = moment("2010-01-01").toDate();
            var config = {
                'method': "POST",
                'headers': {},
                'data': {
                    "lastUpdated": "2015-02-02T07:00:51.496Z",
                    "created": "2015-02-02T05:22:24.867+0000",
                    "organisationUnits": [{
                        "name": "OpUnit1",
                        "id": "opUnit1",
                        "level": 5,
                        "openingDate": openingDate,
                        "externalAccess": true,
                        "lastUpdated": "2015-02-02T07:00:51.496Z",
                        "created": "2015-02-02T05:22:24.867+0000",
                        "attributeValues": [{
                            "created": "2015-02-02T05:26:39.748+0000",
                            "lastUpdated": "2015-02-02T05:26:43.126+0000",
                            "value": "",
                            "attribute": {
                                "id": "bnbnSvRdFYo",
                                "name": "Type of project",
                                "code": "prjType",
                                "created": "2014-09-17T12:12:16.973+0000",
                                "lastUpdated": "2015-02-02T05:22:26.013+0000"
                            }
                        }],
                        "parent": {
                            "id": "proj11",
                            "name": "Project 1",
                            "lastUpdated": "2015-02-02T07:00:51.496Z",
                            "created": "2015-02-02T05:22:24.867+0000"
                        },
                        "children": [{
                            "id": "mod1",
                            "name": "Module 1",
                            "openingDate": openingDate,
                            "externalAccess": true,
                            "level": 6,
                            "lastUpdated": "2015-02-02T07:00:51.496Z",
                            "created": "2015-02-02T05:22:24.867+0000",
                            "attributeValues": [{
                                "created": "2015-02-02T05:26:39.748+0000",
                                "lastUpdated": "2015-02-02T05:26:43.126+0000",
                                "value": "",
                                "attribute": {
                                    "id": "bnbnSvRdFYo",
                                    "name": "Type of project",
                                    "code": "prjType",
                                    "created": "2014-09-17T12:12:16.973+0000",
                                    "lastUpdated": "2015-02-02T05:22:26.013+0000"
                                }
                            }],
                            "parent": {
                                "id": "OpUnit1",
                                "name": "OpUnit1",
                                "lastUpdated": "2015-02-02T07:00:51.496Z",
                                "created": "2015-02-02T05:22:24.867+0000"
                            }
                        }, {
                            "id": "mod2",
                            "name": "Module 2",
                            "openingDate": openingDate,
                            "externalAccess": true,
                            "level": 6,
                            "lastUpdated": "2015-02-02T07:00:51.496Z",
                            "created": "2015-02-02T05:22:24.867+0000",
                            "attributeValues": [{
                                "created": "2015-02-02T05:26:39.748+0000",
                                "lastUpdated": "2015-02-02T05:26:43.126+0000",
                                "value": "",
                                "attribute": {
                                    "id": "bnbnSvRdFYo",
                                    "name": "Type of project",
                                    "code": "prjType",
                                    "created": "2014-09-17T12:12:16.973+0000",
                                    "lastUpdated": "2015-02-02T05:22:26.013+0000"
                                }
                            }],
                            "parent": {
                                "id": "OpUnit1",
                                "name": "OpUnit1",
                                "lastUpdated": "2015-02-02T07:00:51.496Z",
                                "created": "2015-02-02T05:22:24.867+0000"
                            }
                        }]
                    }]
                }
            };

            var expectedConfig = cleanupPayloadInterceptor.request(config);

            var expectedPayload = {
                "organisationUnits": [{
                    "name": "OpUnit1",
                    "id": "opUnit1",
                    "level": 5,
                    "openingDate": openingDate,
                    "externalAccess": true,
                    "attributeValues": [{
                        "value": "",
                        "attribute": {
                            "id": "bnbnSvRdFYo",
                            "name": "Type of project",
                            "code": "prjType",
                        }
                    }],
                    "parent": {
                        "id": "proj11",
                        "name": "Project 1"
                    },
                    "children": [{
                        "id": "mod1",
                        "name": "Module 1",
                        "openingDate": openingDate,
                        "level": 6,
                        "externalAccess": true,
                        "attributeValues": [{
                            "value": "",
                            "attribute": {
                                "id": "bnbnSvRdFYo",
                                "name": "Type of project",
                                "code": "prjType",
                            }
                        }],

                        "parent": {
                            "id": "OpUnit1",
                            "name": "OpUnit1"
                        }
                    }, {
                        "id": "mod2",
                        "name": "Module 2",
                        "openingDate": openingDate,
                        "level": 6,
                        "externalAccess": true,
                        "attributeValues": [{
                            "value": "",
                            "attribute": {
                                "id": "bnbnSvRdFYo",
                                "name": "Type of project",
                                "code": "prjType",
                            }
                        }],

                        "parent": {
                            "id": "OpUnit1",
                            "name": "OpUnit1"
                        }
                    }]
                }]
            };

            expect(expectedConfig.data).toEqual(expectedPayload);
        });

        it("should remove last updated from array based http PUT request payload", function() {
            var config = {
                'method': "PUT",
                'headers': {},
                'data': [{
                    "name": "OpUnit1",
                    "id": "opUnit1",
                    "level": 5,
                    "lastUpdated": "2015-02-02T07:00:51.496Z",
                    "created": "2015-02-02T05:22:24.867+0000"

                }]
            };

            var expectedConfig = cleanupPayloadInterceptor.request(config);

            var expectedPayload = [{
                "name": "OpUnit1",
                "id": "opUnit1",
                "level": 5
            }];
            expect(expectedConfig.data).toEqual(expectedPayload);
        });

    });
});