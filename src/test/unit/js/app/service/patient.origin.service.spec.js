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
                expect(result.data).toEqual(patientOriginDetails);
            });
            httpBackend.flush();
        });

    });
});
