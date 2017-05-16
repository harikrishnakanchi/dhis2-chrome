define(["orgUnitGroupService", "angularMocks", "properties", "metadataConf", "pagingUtils"], function(OrgUnitGroupService, mocks, properties, metadataConf, pagingUtils) {
    describe("orgUnitGroupService", function() {
        var http, httpBackend, orgUnitGroupService, q, orgUnitGroupFields;

        beforeEach(mocks.inject(function($httpBackend, $http, $q) {
            http = $http;
            httpBackend = $httpBackend;
            q = $q;
            orgUnitGroupFields = metadataConf.fields.organisationUnitGroups.params;
            metadataConf.fields.organisationUnitGroups.params = "id,name";
            orgUnitGroupService = new OrgUnitGroupService(http, q);
        }));

        afterEach(function() {
            metadataConf.fields.organisationUnitGroups.params = orgUnitGroupFields;
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should get org unit groups with specific ids", function() {
            var orgUnitGroupIds = ["id1", "id2", "id3"];
            var url = properties.dhis.url +
                "/api/organisationUnitGroups.json?fields=id,name&filter=id:eq:id1&filter=id:eq:id2&filter=id:eq:id3&paging=false";

            orgUnitGroupService.get(orgUnitGroupIds);

            httpBackend.expectGET(url)
                .respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all org unit groups with pagination", function() {
            var url = properties.dhis.url + "/api/organisationUnitGroups.json?fields=id,name&page=1&paging=true&totalPages=true";
            spyOn(pagingUtils, 'paginateRequest').and.callThrough();

            orgUnitGroupService.getAll();

            expect(pagingUtils.paginateRequest).toHaveBeenCalled();
            httpBackend.expectGET(url).respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all org unit groups since lastUpdated", function() {
            var lastUpdatedTime = "2014-12-30T09:13:41.092Z";
            var url = properties.dhis.url + "/api/organisationUnitGroups.json?fields=id,name&filter=lastUpdated:gte:2014-12-30T09:13:41.092Z&page=1&paging=true&totalPages=true";

            orgUnitGroupService.getAll(lastUpdatedTime);
            httpBackend.expectGET(url).respond(200, "ok");
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

        it("should resolve promise if orgUnit is already removed from orgUnit group", function () {
            var orgUnitGroupId = 'ougid1';
            var orgUnitId = 'ouid1';

            orgUnitGroupService.deleteOrgUnit(orgUnitGroupId, orgUnitId);

            httpBackend
                .expectDELETE(properties.dhis.url + "/api/organisationUnitGroups/" + orgUnitGroupId + "/organisationUnits/" + orgUnitId)
                .respond(404, "ok");
            httpBackend.flush();
        });
    });
});
