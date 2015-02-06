define(["orgUnitGroupRepository", "angularMocks", "utils", "timecop"], function(OrgUnitGroupRepository, mocks, utils, timecop) {
    describe("orgunitgroup repository", function() {
        var db, mockStore, orgUnitGroupRepository;

        beforeEach(mocks.inject(function($q) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            orgUnitGroupRepository = new OrgUnitGroupRepository(mockDB.db);

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });


        it("should get all org unit groups", function() {
            var allOrgunitGroups = [{
                "id": 123
            }];
            mockStore.getAll.and.returnValue(allOrgunitGroups);

            var result = orgUnitGroupRepository.getAll();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(allOrgunitGroups);
        });

        it("should find all orgunits", function() {
            var orgUnitGroupIds = ["proj1", "proj2"];
            var orgUnit = orgUnitGroupRepository.findAll(orgUnitGroupIds);
            scope.$apply();

            expect(mockStore.each).toHaveBeenCalled();
            expect(mockStore.each.calls.argsFor(0)[0].inList).toEqual(orgUnitGroupIds);
        });

        it("should upsert org unit group to repo when local data is recently changed and add clientLastUpdatedField", function() {
            var allOrgunitGroups = [{
                "id": 123,
                "lastUpdated": "2014-05-30T12:43:54.972Z"
            }];

            var expectedData = [{
                "id": 123,
                "lastUpdated": "2014-05-30T12:43:54.972Z",
                "clientLastUpdated": "2014-05-30T12:43:54.972Z"
            }];

            orgUnitGroupRepository.upsert(allOrgunitGroups, true);

            expect(mockStore.upsert).toHaveBeenCalledWith(allOrgunitGroups);
        });

        it("should get org unit group", function() {
            var id = "123";

            orgUnitGroupRepository.get(id);

            expect(mockStore.find).toHaveBeenCalledWith([id]);
        });
    });
});
