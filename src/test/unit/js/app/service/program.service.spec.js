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

        it("should download programs last updated since lastUpdated", function() {
            var lastUpdatedTime = "2014-12-30T09:13:41.092Z";

            programService.getAll(lastUpdatedTime);

            httpBackend.expectGET(properties.dhis.url + '/api/programs.json?fields=:all&paging=false&filter=lastUpdated:gte:2014-12-30T09:13:41.092Z').respond(200, "ok");
            httpBackend.flush();
        });
    });
});
