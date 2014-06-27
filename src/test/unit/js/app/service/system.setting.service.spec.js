define(["systemSettingService", "angularMocks", "properties", "utils"], function(SystemSettingService, mocks, properties, utils) {
    describe("systemSettingService", function() {

        var http, httpBackend, service;

        beforeEach(mocks.inject(function($httpBackend, $http) {
            http = $http;
            httpBackend = $httpBackend;
            service = new SystemSettingService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should exclude data elements for a project", function() {
            var projectId = "12445";
            var expectedSystemSettings = {
                "excludedDataElements": {
                    "1": ["123452", "123457"]
                }
            };
            var systemSetting = {
                projectId: projectId,
                settings: expectedSystemSettings
            };
            service.excludeDataElements(systemSetting);
            httpBackend.expectPOST(properties.dhis.url + "/api/systemSettings/" + projectId, expectedSystemSettings).respond(200, "ok");
            httpBackend.flush();
        });
    });
});