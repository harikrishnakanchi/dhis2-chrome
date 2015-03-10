define(["patientOriginService", "angularMocks", "properties", "utils", "md5", "timecop"], function(PatientOriginService, mocks, properties, utils, md5, timecop) {
    describe("patientOriginService", function() {

        var http, httpBackend, patientOriginService, patientOriginDetails, q;

        beforeEach(mocks.inject(function($httpBackend, $http, $q) {
            q = $q;
            http = $http;
            httpBackend = $httpBackend;
            patientOriginService = new PatientOriginService(http);

            patientOriginDetails = {
                "prj1": JSON.stringify({
                    clientLastUpdated: "2014-05-30T12:43:54.972Z",
                    origins: [{
                        'originName': 'origin1',
                        'latitude': '80',
                        'longitude': '180'
                    }, {
                        'originName': 'origin2',
                        'latitude': '80',
                        'longitude': '180'
                    }]
                }),
                "prj2": JSON.stringify({
                    clientLastUpdated: "2014-05-30T12:43:54.972Z",
                    origins: []
                })
            };

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
            Timecop.returnToPresent();
            Timecop.uninstall();
        });


        it("should get all patient origin details", function() {
            var result = {};
            httpBackend.expectGET(properties.dhis.url + "/api/systemSettings/patientOriginDetails").respond(200, patientOriginDetails);
            patientOriginService.getAll().then(function(result) {
                expect(result).toEqual([{
                    key: "prj1",
                    value: {
                        clientLastUpdated: "2014-05-30T12:43:54.972Z",
                        origins: [{
                            'originName': 'origin1',
                            'latitude': '80',
                            'longitude': '180'
                        }, {
                            'originName': 'origin2',
                            'latitude': '80',
                            'longitude': '180'
                        }]
                    }
                }, {
                    key: "prj2",
                    value: {
                        clientLastUpdated: "2014-05-30T12:43:54.972Z",
                        origins: []
                    }
                }]);
            });
            httpBackend.flush();
        });

        it("should post patientOriginDetails for a project", function() {
            var projectId = "prj1";
            var patientOriginDetails = {
                key: projectId,
                value: {
                    clientLastUpdated: "2014-05-30T12:43:54.972Z",
                    origins: [{
                        'originName': 'origin1',
                        'latitude': '80',
                        'longitude': '180'
                    }]
                }
            };

            patientOriginService.upsert(patientOriginDetails);
            var expectedPayload = {
                "prj1": {
                    clientLastUpdated: "2014-05-30T12:43:54.972Z",
                    origins: [{
                        'originName': 'origin1',
                        'latitude': '80',
                        'longitude': '180'
                    }]
                }
            };
            httpBackend.expectPOST(properties.dhis.url + "/api/systemSettings/patientOriginDetails", expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });

    });
});
