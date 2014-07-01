define(["orgUnitRepository", "utils", "angularMocks"], function(OrgUnitRepository, utils, mocks) {
    describe("Org Unit Repository specs", function() {
        var mockOrgStore, mockDb, orgUnitRepository, q, orgUnits;

        beforeEach(mocks.inject(function($q) {
            q = $q;
            orgUnits = [{
                "a": "b"
            }, {
                "c": "d"
            }];
            mockDb = utils.getMockDB(q, {}, orgUnits);
            mockOrgStore = mockDb.objectStore;
            orgUnitRepository = new OrgUnitRepository(mockDb.db);
        }));

        it("should save org hierarchy", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1
            }];

            orgUnitRepository.upsert(orgUnit).then(function(data) {
                expect(data).toEqual(orgUnit);
            });
            expect(mockOrgStore.upsert).toHaveBeenCalledWith(orgUnit);
        });

        it("should get all org units", function() {
            orgUnitRepository.getAll("someOrgUnit").then(function(results) {
                expect(results).toEqual(orgUnits);
            });
            expect(mockOrgStore.getAll).toHaveBeenCalled();
        });
    });
});