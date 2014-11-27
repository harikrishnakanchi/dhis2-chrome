define(["orgUnitGroupService", "angularMocks", "properties"], function(OrgUnitGroupService, mocks, properties) {
    describe("dataset service", function() {
        var http, httpBackend, orgUnitGroupService;

        beforeEach(mocks.inject(function($httpBackend, $http) {
            http = $http;
            httpBackend = $httpBackend;
            orgUnitGroupService = new OrgUnitGroupService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should update orgUnitGroups", function() {
            var orgUnitGroups = [{
                "id": "a35778ed565",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "a119bd25ace",
                    "name": "Out-patient General"
                }, {
                    "id": "a0c51512f88",
                    "name": "OBGYN"
                }, {
                    "id": "a43bd484a05",
                    "name": "Laboratory"
                }],
                "shortName": "Most-at-risk Population"
            }];

            var expectedPayload = {
                organisationUnitGroups: orgUnitGroups
            };

            orgUnitGroupService.upsert(orgUnitGroups);
            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });
    });
});