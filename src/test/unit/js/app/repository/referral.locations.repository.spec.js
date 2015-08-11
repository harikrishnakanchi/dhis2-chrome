define(["referralLocationsRepository", "angularMocks", "utils"], function(ReferralLocationsRepository, mocks, utils) {
    describe("referralLocationsRepository", function() {
        var repo, mockStore;

        beforeEach(mocks.inject(function($q) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            repo = new ReferralLocationsRepository(mockDB.db, $q);
        }));

        describe("get", function() {
            it("should return empty array when opUnitId is not given", function() {
                repo.get("").then(function(data) {
                    expect(data).toEqual([]);
                });
                expect(mockStore.find).not.toHaveBeenCalled();
            });
        });
    });
});