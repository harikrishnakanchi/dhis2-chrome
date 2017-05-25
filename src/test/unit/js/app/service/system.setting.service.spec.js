define(["systemSettingService", "angularMocks", "utils", "dhisUrl"], function(SystemSettingService, mocks, utils, dhisUrl) {
    describe("systemSettingService", function() {

        var http, httpBackend, service, q;

        beforeEach(mocks.inject(function($httpBackend, $http) {
            http = $http;
            httpBackend = $httpBackend;
            service = new SystemSettingService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should get system settings", function() {
            var systemSettingsFromDhis = {
                fieldAppSettings: {
                    moduleTemplates: {
                        'ds1': {}
                    },
                    anotherSetting: "foo"
                },
                versionCompatibilityInfo: {
                    compatiblePraxisVersions: [
                        '5.0',
                        '6.0'
                    ]
                },
                "notificationSetting": {
                    notificationSetting: '1.5'
                }
            };

            httpBackend.expectGET(dhisUrl.systemSettings + "?key=fieldAppSettings,versionCompatibilityInfo,notificationSetting").respond(200, systemSettingsFromDhis);

            var actualResult;
            service.getSystemSettings().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            var expectedSystemSettings = [{
                "key": "moduleTemplates",
                "value": {
                    "ds1": {}
                }
            }, {
                "key": "anotherSetting",
                "value": "foo"
            }, {
                "key": "compatiblePraxisVersions",
                "value":["5.0", "6.0"]
            }, {
                "key": "notificationSetting",
                "value": "1.5"
            },];

            expect(actualResult).toEqual(expectedSystemSettings);
        });

        it("should load pre-packaged system settings", function() {
            var systemSettingsFromFile = {
                "fieldAppSettings": {
                    "moduleTemplates": {
                        "ds1": {}
                    },
                    "anotherSetting": "foo"
                }
            };

            httpBackend.expectGET("data/systemSettings.json").respond(200, systemSettingsFromFile);

            var actualResult;
            service.loadFromFile().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            expectedSystemSettings = [{
                "key": "moduleTemplates",
                "value": {
                    "ds1": {}
                }
            }, {
                "key": "anotherSetting",
                "value": "foo"
            }];

            expect(actualResult).toEqual(expectedSystemSettings);
        });

        it("should return empty system settings if local file does not exist", function() {
            httpBackend.expectGET("data/systemSettings.json").respond(404);

            var actualResult;
            service.loadFromFile().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            expect(actualResult).toEqual([]);
        });
    });
});
