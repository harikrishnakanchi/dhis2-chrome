define(["orgUnitGroupService", "angularMocks", "properties"], function(OrgUnitGroupService, mocks, properties) {
    describe("orgUnitGroupService", function() {
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

        it("should get org unit groups with specific ids", function() {
            var orgUnitGroupIds = ["id1", "id2", "id3"];

            orgUnitGroupService.get(orgUnitGroupIds);

            httpBackend.expectGET(properties.dhis.url +
                    "/api/organisationUnitGroups.json?filter=id:eq:id1&filter=id:eq:id2&filter=id:eq:id3&paging=false&fields=:all")
                .respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all org unit groups", function() {
            orgUnitGroupService.getAll();

            httpBackend.expectGET(properties.dhis.url + "/api/organisationUnitGroups.json?fields=:all&paging=false").respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all org unit groups since lastUpdated", function() {
            var lastUpdatedTime = "2014-12-30T09:13:41.092Z";

            orgUnitGroupService.getAll(lastUpdatedTime);
            httpBackend.expectGET(properties.dhis.url + "/api/organisationUnitGroups.json?fields=:all&paging=false&filter=lastUpdated:gte:2014-12-30T09:13:41.092Z").respond(200, "ok");
            httpBackend.flush();
        });

        it("should add orgUnit to orgUnit group", function () {
            var orgUnitGroupId = 'ougid1';
            var orgUnitId = 'ouid1';

            orgUnitGroupService.addOrgUnit(orgUnitGroupId, orgUnitId);

            httpBackend
                .expectPOST(properties.dhis.url + "/api/organisationUnitGroups/" + orgUnitGroupId + "/organisationUnits/" + orgUnitId)
                .respond(204, "ok");
            httpBackend.flush();
        });

        it("should delete orgUnit from orgUnit group", function () {
            var orgUnitGroupId = 'ougid1';
            var orgUnitId = 'ouid1';

            orgUnitGroupService.deleteOrgUnit(orgUnitGroupId, orgUnitId);

            httpBackend
                .expectDELETE(properties.dhis.url + "/api/organisationUnitGroups/" + orgUnitGroupId + "/organisationUnits/" + orgUnitId)
                .respond(204, "ok");
            httpBackend.flush();
        });
    });
});
