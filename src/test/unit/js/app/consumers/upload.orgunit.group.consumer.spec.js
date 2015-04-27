define(["uploadOrgUnitGroupConsumer", "orgUnitGroupService", "orgUnitGroupRepository", "orgUnitService", "angularMocks", "utils"], function(UploadOrgUnitGroupConsumer, OrgUnitGroupService, OrgUnitGroupRepository, OrgUnitService, mocks, utils) {
    describe("uploadOrgUnitGroupConsumer", function() {
        var uploadOrgUnitGroupConsumer, message, payload, orgUnitGroupService, q, scope, orgUnitGroupRepository, orgUnitGroupFromIDB, orgUnitService;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            orgUnitGroupService = new OrgUnitGroupService();
            orgUnitGroupRepository = new OrgUnitGroupRepository();
            orgUnitService = new OrgUnitService();

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

            var orgUnitIdsFromDHIS = ["o1"];

            spyOn(orgUnitGroupRepository, "get").and.callFake(function() {
                return orgUnitGroupFromIDB;
            });
            spyOn(orgUnitGroupRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitGroupService, "upsert").and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitService, "getIds").and.returnValue(utils.getPromise(q, orgUnitIdsFromDHIS));

            uploadOrgUnitGroupConsumer = new UploadOrgUnitGroupConsumer(orgUnitGroupService, orgUnitGroupRepository, orgUnitService, q);
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

            var expectedDhisPayload = [{
                "id": "a35778ed565",
                "lastUpdated": "2014-10-20T09:01:12.020+0000",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "o1",
                    "name": "org1"
                }, {
                    "id": "o2",
                    "name": "org2",
                    "localStatus": "NEW"
                }, {
                    "id": "o4",
                    "name": "org4"
                }]
            }];

            var expectedIdbPayload = [{
                "id": "a35778ed565",
                "lastUpdated": "2014-10-20T09:01:12.020+0000",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "o1",
                    "name": "org1"
                }, {
                    "id": "o2",
                    "name": "org2",
                    "localStatus": "NEW"
                }, {
                    "id": "o4",
                    "name": "org4"
                }]
            }];

            uploadOrgUnitGroupConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.getIds).toHaveBeenCalledWith(["o1", "o2"]);
            expect(orgUnitGroupService.upsert).toHaveBeenCalledWith(expectedDhisPayload);
            expect(orgUnitGroupRepository.upsert).toHaveBeenCalledWith(expectedIdbPayload);
        });
    });
});
