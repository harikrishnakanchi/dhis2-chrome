define(["uploadOrgUnitGroupConsumer", "orgUnitGroupService", "orgUnitGroupRepository", "angularMocks", "utils"], function(UploadOrgUnitGroupConsumer, OrgUnitGroupService, OrgUnitGroupRepository, mocks, utils) {
    describe("uploadOrgUnitGroupConsumer", function() {
        var uploadOrgUnitGroupConsumer, message, payload, orgUnitGroupService, q, scope, orgUnitGroupRepository, orgUnitGroupFromIDB;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            orgUnitGroupService = new OrgUnitGroupService();
            orgUnitGroupRepository = new OrgUnitGroupRepository();

            orgUnitGroupFromIDB = {
                "id": "a35778ed565",
                "lastUpdated": "2014-10-20T09:01:12.020+0000",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "o1",
                    "name": "org1"
                }]
            };

            spyOn(orgUnitGroupRepository, "get").and.callFake(function() {
                return orgUnitGroupFromIDB;
            });
            spyOn(orgUnitGroupService, "upsert");

            uploadOrgUnitGroupConsumer = new UploadOrgUnitGroupConsumer(orgUnitGroupService, orgUnitGroupRepository, q);
        }));

        it("should upload orgunit groups to dhis", function() {
            payload = [{
                "id": "a35778ed565",
                "name": "Most-at-risk Population"
            }];

            message = {
                data: {
                    data: payload,
                    type: "upsertOrgUnitGroups"
                }
            };

            uploadOrgUnitGroupConsumer.run(message);
            scope.$apply();

            expect(orgUnitGroupService.upsert).toHaveBeenCalledWith([orgUnitGroupFromIDB]);
        });
    });
});
