define(["programService", "angularMocks", "properties", "utils"], function(ProgramService, mocks, properties, utils) {
    describe("program service", function() {
        var http, httpBackend, programService;

        beforeEach(mocks.inject(function($httpBackend, $http) {
            http = $http;
            httpBackend = $httpBackend;
            programService = new ProgramService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should upload program to dhis", function() {
            var programs = [{
                "id": "id123",
                "name": "program1",
                "kind": "SINGLE_EVENT_WITHOUT_REGISTRATION",
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org unit 1"
                }]
            }];

            programService.upload(programs);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", {
                "programs": programs
            }).respond(200, "ok");
            httpBackend.flush();
        });
    });
});