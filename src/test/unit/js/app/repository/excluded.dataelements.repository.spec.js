define(["excludedDataElementsRepository", "angularMocks", "utils"], function(ExcludedDataElementsRepository, mocks, utils) {
    describe("excludedDataElementsRepository", function() {
        var mockStore, scope, excludedDataElementsRepository;
        beforeEach(mocks.inject(function($q, $rootScope) {
            scope = $rootScope.$new();
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            excludedDataElementsRepository = new ExcludedDataElementsRepository(mockDB.db, $q);
        }));

        it("should upsert exlcuded data elements", function() {
            var excludedDataElements = [{
                "orgUnit": "mod1",
                "dataElements": [{
                    "id": "de1"
                }, {
                    "id": "de2"
                }],
                "clientLastUpdated": "2014-05-30T12:43:54.972Z"
            }];

            excludedDataElementsRepository.upsert(excludedDataElements);

            expect(mockStore.upsert).toHaveBeenCalledWith(excludedDataElements);
        });

        it("should get exlcuded data elements", function() {
            excludedDataElementsRepository.get("mod1");
            expect(mockStore.find).toHaveBeenCalledWith("mod1");
        });
    });
});
