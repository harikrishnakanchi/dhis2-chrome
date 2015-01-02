define(["uploadOrgUnitGroupConsumer", "orgUnitGroupService", "orgUnitGroupRepository", "angularMocks", "utils"], function(UploadOrgUnitGroupConsumer, OrgUnitGroupService, OrgUnitGroupRepository, mocks, utils) {
    describe("uploadOrgUnitGroupConsumer", function() {
        var uploadOrgUnitGroupConsumer, message, payload, orgUnitGroupService, q, scope, orgUnitGroupRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            payload = [{
                "id": "a35778ed565",
                "name": "Most-at-risk Population"
            }];

            orgUnitGroupService = new OrgUnitGroupService();
            orgUnitGroupRepository = new OrgUnitGroupRepository();

            spyOn(orgUnitGroupService, "upsert");

            uploadOrgUnitGroupConsumer = new UploadOrgUnitGroupConsumer(orgUnitGroupService, orgUnitGroupRepository);

            message = {
                data: {
                    data: payload,
                    type: "upsertOrgUnitGroups"
                }
            };
        }));

        it("should upload orgunit groups to dhis", function() {
            var orgUnitGroupFromIDB = {
                "id": "a35778ed565",
                "lastUpdated": "2014-10-20T09:01:12.020+0000",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "o1",
                    "name": "org1"
                }]
            };

            spyOn(orgUnitGroupRepository, "get").and.returnValue(utils.getPromise(q, orgUnitGroupFromIDB));
            uploadOrgUnitGroupConsumer.run(message);
            scope.$apply();

            expect(orgUnitGroupRepository.get).toHaveBeenCalledWith(["a35778ed565"]);
            expect(orgUnitGroupService.upsert).toHaveBeenCalledWith(orgUnitGroupFromIDB);
        });
    });
});
