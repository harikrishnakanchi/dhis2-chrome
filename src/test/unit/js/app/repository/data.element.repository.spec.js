define(["dataElementRepository", "angularMocks", "utils"], function(DataElementRepository, mocks, utils) {
    describe("data element repository", function() {
        var db, mockStore, dataElementRepository;
        beforeEach(mocks.inject(function($q, $rootScope) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            dataElementRepository = new DataElementRepository(mockDB.db);
        }));

        it("should get all data elements", function() {
            dataElementRepository.getAll();
            
            expect(mockStore.getAll).toHaveBeenCalled();
        });

        it('should get data element for the given data element id', function () {
            var dataElementId = "someDataElementId";
            dataElementRepository.get(dataElementId);

            expect(mockStore.find).toHaveBeenCalled();
        });

        it('should get all data elements for the list of data elements', function() {
            var dataElementIds = ["someDataElem1", "someDataElem2"];

            dataElementRepository.findAll(dataElementIds);

            expect(mockStore.each).toHaveBeenCalled();
        });
    });
});