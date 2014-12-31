define(["changeLogRepository", "angularMocks", "utils"], function(ChangeLogRepository, mocks, utils) {
    describe("changeLogRepository", function() {
        var q, repo, mockStore, mockDB, lastUpdatedTime, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            lastUpdatedTime = "2014-12-30T09:13:41.092Z";

            mockDB = utils.getMockDB($q, lastUpdatedTime);
            mockStore = mockDB.objectStore;
            repo = new ChangeLogRepository(mockDB.db);
        }));

        it("should upsert change log", function() {
            repo.upsert("orgUnit", lastUpdatedTime);
            expect(mockStore.upsert).toHaveBeenCalledWith({
                "type": 'orgUnit',
                "lastUpdatedTime": lastUpdatedTime
            });
        });

        it("should get change log for a key", function() {
            var actualValue;

            repo.get("metadata").then(function(data) {
                actualValue = data;
            });

            scope.$apply();

            expect(actualValue).toEqual(lastUpdatedTime);
        });
    });
});
