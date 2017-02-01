define(['customAttributeRepository', 'angularMocks', 'utils'], function (CustomAttributeRepository, mocks, utils) {
    describe('customAttributeRepository', function () {
        var q, mockStore, customAttributeRepository;

        beforeEach(mocks.inject(function ($q) {
            q = $q;
            var mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;

            customAttributeRepository = new CustomAttributeRepository(mockDB.db, q);
        }));

        it('should get all the custom attributes from the store', function () {
            customAttributeRepository.getAll();
            expect(mockStore.getAll).toHaveBeenCalled();
        });
    });
});