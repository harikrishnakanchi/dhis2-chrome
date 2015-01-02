define(["orgUnitGroupRepository", "angularMocks", "utils"], function(OrgUnitGroupRepository, mocks, utils) {
    describe("orgunitgroup repository", function() {
        var db, mockStore, orgUnitGroupRepository;

        beforeEach(mocks.inject(function($q) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            orgUnitGroupRepository = new OrgUnitGroupRepository(mockDB.db);
        }));

        it("should get all org unit groups", function() {
            var allOrgunitGroups = [{
                "id": 123
            }];
            mockStore.getAll.and.returnValue(allOrgunitGroups);

            var result = orgUnitGroupRepository.getAll();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(allOrgunitGroups);
        });

        it("should upsert org unit group to repo", function() {
            var allOrgunitGroups = [{
                "id": 123
            }];

            orgUnitGroupRepository.upsert(allOrgunitGroups);

            expect(mockStore.upsert).toHaveBeenCalledWith(allOrgunitGroups);
        });

        it("should get org unit group", function() {
            var id = "123";

            orgUnitGroupRepository.get(id);

            expect(mockStore.find).toHaveBeenCalledWith([id]);
        });
    });
});
