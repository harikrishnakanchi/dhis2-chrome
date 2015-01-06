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

        it("should post correct systemsettings for excludedDataElements ", function() {
            var systemSettingsAlreadyStoredInIndexedDb = {
                "excludedDataElements": {
                    "mod1": [
                        "de1"
                    ],
                    "mod2": [
                        "de2"
                    ]
                }
            };

            var projectId = "prj1";
            var newSystemSettingForModules = {
                projectId: projectId,
                settings: {
                    "excludedDataElements": {
                        "mod1": ["de1", "de2"],
                        "mod3": ["de4"]
                    }
                },
                indexedDbOldSystemSettings: systemSettingsAlreadyStoredInIndexedDb
            };

            service.excludeDataElements(newSystemSettingForModules);

            var systemSettingsAlreadyStoredInDhis = {
                "excludedDataElements": {
                    "mod1": [
                        "de1"
                    ],
                    "mod2": [
                        "de2", "de3"
                    ]
                }
            };

            httpBackend.expectGET(properties.dhis.url + "/api/systemSettings/" + projectId).respond(200, systemSettingsAlreadyStoredInDhis);

            var expectedSystemSettings = {
                "excludedDataElements": {
                    "mod1": [
                        "de1", "de2"
                    ],
                    "mod2": [
                        "de2", "de3"
                    ],
                    "mod3": ["de4"]
                }
            };

            httpBackend.expectPOST(properties.dhis.url + "/api/systemSettings/" + projectId, expectedSystemSettings).respond(200, "ok");
            httpBackend.flush();
        });
    });
});