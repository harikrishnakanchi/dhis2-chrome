define(["uploadOrgUnitGroupConsumer", "orgUnitGroupService", "orgUnitGroupRepository", "angularMocks", "utils"], function(UploadOrgUnitGroupConsumer, OrgUnitGroupService, OrgUnitGroupRepository, mocks, utils) {
    describe("uploadOrgUnitGroupConsumer", function() {
        var uploadOrgUnitGroupConsumer, message, payload, orgUnitGroupService, q, scope, orgUnitGroupRepository, orgUnitGroupFromIDB, orgUnitService;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            orgUnitGroupService = new OrgUnitGroupService();
            orgUnitGroupRepository = new OrgUnitGroupRepository();

            spyOn(orgUnitGroupService, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitGroupRepository, "clearStatusFlag").and.returnValue(utils.getPromise(q, {}));

            uploadOrgUnitGroupConsumer = new UploadOrgUnitGroupConsumer(orgUnitGroupService, orgUnitGroupRepository, q);
        }));

        it("should upload orgunit groups to dhis", function() {
            orgUnitGroupFromIDB = {
                "id": "a35778ed565",
                "lastUpdated": "2014-10-20T09:01:12.020+0000",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "o1",
                    "name": "org1",
                    "localStatus": "NEW"
                }, {
                    "id": "o2",
                    "name": "org2",
                    "localStatus": "NEW"
                }, {
                    "id": "o3",
                    "name": "org3",
                    "localStatus": "DELETED"
                }, {
                    "id": "o4",
                    "name": "org4"
                }]
            };

            spyOn(orgUnitGroupRepository, "findAll").and.returnValue(utils.getPromise(q, [orgUnitGroupFromIDB]));

            message = {
                "data": {
                    "data": {
                        "orgUnitGroupIds": ["a35778ed565"],
                        "orgUnitIds": ["o1", "o3", "o4"]
                    },
                    "type": "upsertOrgUnitGroups"
                }
            };

            uploadOrgUnitGroupConsumer.run(message);
            scope.$apply();

            var expectedDhisPayload = [{
                "id": "a35778ed565",
                "lastUpdated": "2014-10-20T09:01:12.020+0000",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "o1",
                    "name": "org1"
                }, {
                    "id": "o4",
                    "name": "org4"
                }]
            }];

            expect(orgUnitGroupRepository.findAll).toHaveBeenCalledWith(["a35778ed565"]);
            expect(orgUnitGroupService.upsert).toHaveBeenCalledWith(expectedDhisPayload);
            expect(orgUnitGroupRepository.clearStatusFlag.calls.count()).toEqual(1);
            expect(orgUnitGroupRepository.clearStatusFlag.calls.argsFor(0)).toEqual(["a35778ed565", ["o1", "o3", "o4"]]);
        });
    });
});
