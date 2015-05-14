define(["orgUnitGroupRepository", "angularMocks", "utils", "timecop"], function(OrgUnitGroupRepository, mocks, utils, timecop) {
    describe("orgunitgroup repository", function() {
        var db, mockStore, scope, orgUnitGroupRepository, q;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            orgUnitGroupRepository = new OrgUnitGroupRepository(mockDB.db, q);

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

            expect(mockStore.find).toHaveBeenCalledWith(id);
        });

        it("should clear local status", function() {
            var ougInDb = {
                "id": "oug1",
                "organisationUnits": [{
                    "id": "ou1",
                    "localStatus": "NEW"
                }, {
                    "id": "ou2",
                    "localStatus": "DELETED"
                }, {
                    "id": "ou3"
                }, {
                    "id": "ou4",
                    "localStatus": "NEW"
                }, {
                    "id": "ou5",
                    "localStatus": "DELETED"
                }, {
                    "id": "ou6"
                }]
            };

            mockStore.find.and.returnValue(utils.getPromise(q, ougInDb));
            orgUnitGroupRepository.clearStatusFlag("oug1", ["ou0", "ou1", "ou2", "ou3"]);
            scope.$apply();

            expect(mockStore.upsert).toHaveBeenCalledWith({
                "id": "oug1",
                "organisationUnits": [{
                    "id": "ou1"
                }, {
                    "id": "ou3"
                }, {
                    "id": "ou4",
                    "localStatus": "NEW"
                }, {
                    "id": "ou5",
                    "localStatus": "DELETED"
                }, {
                    "id": "ou6"
                }]
            });
        });
    });
});
