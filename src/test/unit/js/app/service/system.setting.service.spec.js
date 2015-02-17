define(["systemSettingService", "angularMocks", "properties", "utils", "md5", "timecop"], function(SystemSettingService, mocks, properties, utils, md5, timecop) {
    describe("systemSettingService", function() {

        var http, httpBackend, service, allSystemSettings, q;

        beforeEach(mocks.inject(function($httpBackend, $http, $q) {
            q = $q;
            http = $http;
            httpBackend = $httpBackend;
            service = new SystemSettingService(http);

            allSystemSettings = {
                "keyAccountRecovery": true,
                "exclude_a467559322b": JSON.stringify({
                    clientLastUpdated: "2014-05-30T12:43:54.972Z",
                    dataElements: ["de1", "de2"]
                }),
                "exclude_b567559322c": JSON.stringify({
                    clientLastUpdated: "2014-05-30T12:43:54.972Z",
                    dataElements: ["de3", "de1"]
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

        it("should get all excluded data elements", function() {
            var result = {};
            httpBackend.expectGET(properties.dhis.url + "/api/systemSettings").respond(200, allSystemSettings);
            service.getAll().then(function(data) {
                result = data;
                expect(result).toEqual([{
                    key: "a467559322b",
                    value: {
                        clientLastUpdated: "2014-05-30T12:43:54.972Z",
                        dataElements: ["de1", "de2"]
                    }
                }, {
                    key: "b567559322c",
                    value: {
                        clientLastUpdated: "2014-05-30T12:43:54.972Z",
                        dataElements: ["de3", "de1"]
                    }
                }]);
            });
            httpBackend.flush();
        });

        it("should post excluded data elements settings for a module", function() {
            var moduleId = "mod1";
            var args = {
                key: moduleId,
                value: {
                    clientLastUpdated: "2014-05-30T12:43:54.972Z",
                    dataElements: ["de1", "de2"]
                }
            };

            var key = "exclude_" + moduleId;
            var excludedDataElements = ["de1", "de2"];
            service.upsert(args);
            var expectedPayload = {
                clientLastUpdated: "2014-05-30T12:43:54.972Z",
                dataElements: ["de1", "de2"]
            };
            httpBackend.expectPOST(properties.dhis.url + "/api/systemSettings/" + key, expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });
    });
});