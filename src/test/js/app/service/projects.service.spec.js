define(["projectsService", "angularMocks", "properties"], function(ProjectsService, mocks, properties) {
    describe("projects controller", function() {
        var http, httpBackend, scope;

        beforeEach(mocks.inject(function($rootScope, $httpBackend, $http) {
            scope = $rootScope.$new();
            http = $http;
            httpBackend = $httpBackend;
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should save organization unit in dhis", function() {
            var projectService = new ProjectsService(http);
            var orgUnit = {
                "id": "org_0",
                "level": 1
            };
            projectService.create(orgUnit);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", {
                "organisationUnits": [orgUnit]
            }).respond(200, "ok");
            httpBackend.flush();
        });
    });
});