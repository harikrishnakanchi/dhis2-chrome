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
            var program = {
                "id": "id123",
                "name": "program1",
                "kind": "SINGLE_EVENT_WITHOUT_REGISTRATION",
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org unit 1"
                }]
            };

            programService.upload(program);

            httpBackend.expectPOST(properties.dhis.url + "/api/programs", program).respond(200, "ok");
            httpBackend.flush();
        });
    });
});