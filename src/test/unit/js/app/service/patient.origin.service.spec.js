define(["patientOriginService", "angularMocks", "properties", "utils", "md5", "timecop"], function(PatientOriginService, mocks, properties, utils, md5, timecop) {
    describe("patientOriginService", function() {

        var http, httpBackend, patientOriginService, patientOriginDetails, q;

        beforeEach(mocks.inject(function($httpBackend, $http, $q) {
            q = $q;
            http = $http;
            httpBackend = $httpBackend;
            patientOriginService = new PatientOriginService(http);

            patientOriginDetails = {
                'origin_details_prj1': JSON.stringify({
                    'origins': [{
                        'id': 'origin1',
                        'name': 'origin1',
                        'latitude': '80',
                        'longitude': '180',
                        'clientLastUpdated': "2014-05-30T12:43:54.972Z",
                    }, {
                        'id': 'origin2',
                        'name': 'origin2',
                        'latitude': '80',
                        'longitude': '180',
                        'clientLastUpdated': "2014-05-30T12:43:54.972Z",
                    }]
                }),
                'origin_details_prj2': JSON.stringify({
                    'origins': []
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
            httpBackend.expectGET(properties.dhis.url + "/api/systemSettings").respond(200, patientOriginDetails);
            patientOriginService.getAll().then(function(result) {
                expect(result).toEqual([{
                    orgUnit: "prj1",
                    origins: [{
                        'id': 'origin1',
                        'name': 'origin1',
                        'latitude': '80',
                        'longitude': '180',
                        'clientLastUpdated': "2014-05-30T12:43:54.972Z",
                    }, {
                        'id': 'origin2',
                        'name': 'origin2',
                        'latitude': '80',
                        'longitude': '180',
                        'clientLastUpdated': "2014-05-30T12:43:54.972Z",
                    }]
                }, {
                    orgUnit: "prj2",
                    origins: []
                }]);
            });
            httpBackend.flush();
        });

        it("should post patientOriginDetails for a project", function() {
            var patientOriginDetails = {
                orgUnit: "prj1",
                origins: [{
                    'id': 'origin1',
                    'name': 'origin1',
                    'latitude': '80',
                    'longitude': '180',
                    'clientLastUpdated': "2014-05-30T12:43:54.972Z",
                }]
            };

            var expectedPayload = JSON.stringify({
                "origins": [{
                    "id": "origin1",
                    "name": "origin1",
                    "latitude": "80",
                    "longitude": "180",
                    "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                }]
            });

            patientOriginService.upsert(patientOriginDetails);
            httpBackend.expectPOST(properties.dhis.url + "/api/systemSettings/origin_details_prj1", expectedPayload).respond(200, "ok");

            httpBackend.flush();
        });

    });
});
