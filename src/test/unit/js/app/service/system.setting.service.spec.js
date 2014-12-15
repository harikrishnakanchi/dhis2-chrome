define(["systemSettingService", "angularMocks", "properties", "utils", "md5"], function(SystemSettingService, mocks, properties, utils, md5) {
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

        it("should post excluded data elements for a project if checksum is same", function() {
            var projectId = "12445";
            var expectedSystemSettings = {
                "excludedDataElements": {
                    "1": ["123452", "123457"]
                }
            };
            var systemSetting = {
                projectId: projectId,
                settings: expectedSystemSettings,
                checksum: md5("1234")
            };
            service.excludeDataElements(systemSetting);

            httpBackend.expectGET(properties.dhis.url + "/api/systemSettings/" + projectId).respond(200, "1234");
            httpBackend.expectPOST(properties.dhis.url + "/api/systemSettings/" + projectId, expectedSystemSettings).respond(200, "ok");
            httpBackend.flush();
        });

        it("should not post the excluded data elements if the checksum is not the same", function() {
            var projectId = "12445";
            var expectedSystemSettings = {
                "excludedDataElements": {
                    "1": ["123452", "123457"]
                }
            };
            var systemSetting = {
                projectId: projectId,
                settings: expectedSystemSettings,
                checksum: md5("123")
            };
            service.excludeDataElements(systemSetting);

            httpBackend.expectGET(properties.dhis.url + "/api/systemSettings/" + projectId).respond(200, "1234");
            httpBackend.flush();
        });
    });
});
