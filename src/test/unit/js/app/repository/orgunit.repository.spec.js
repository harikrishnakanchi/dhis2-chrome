define(["orgUnitRepository", "utils", "angularMocks"], function(OrgUnitRepository, utils, mocks) {
    describe("Org Unit Repository specs", function() {
        var mockOrgStore, db, orgUnitRepository, q;
        beforeEach(mocks.inject(function($q) {
            q = $q;

            mockOrgStore = {
                upsert: function() {},
                getAll: function() {}
            };
            db = {
                objectStore: function() {}
            };

            spyOn(db, "objectStore").and.returnValue(mockOrgStore);
            spyOn(mockOrgStore, "upsert").and.returnValue(utils.getPromise(q, "someId"));

            orgUnitRepository = new OrgUnitRepository(db);
        }));

        it("should save org hierarchy", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1
            }];

            orgUnitRepository.save(orgUnit).then(function(data) {
                expect(data).toEqual(orgUnit);
            });

            expect(db.objectStore).toHaveBeenCalledWith("organisationUnits");
            expect(mockOrgStore.upsert).toHaveBeenCalledWith(orgUnit);
        });
    });
});