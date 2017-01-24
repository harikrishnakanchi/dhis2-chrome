define(['customAttributeRepository', 'angularMocks', 'utils'], function (CustomAttributeRepository, mocks, utils) {
    describe('customAttributeRepository', function () {
        var q, mockStore, customAttributeRepository;

        beforeEach(mocks.inject(function ($q) {
            q = $q;
            var mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;

            customAttributeRepository = new CustomAttributeRepository(mockDB.db, q);
        }));

        it('should upsert the custom attributes', function () {
            var mockAttributes = [{
                id: 'someId',
                code: 'someCode'
            }, {
                id: 'someOtherId',
                code: 'someOtherCode'
            }];

            customAttributeRepository.upsert(mockAttributes);
            expect(mockStore.upsert).toHaveBeenCalledWith(mockAttributes);
        });

        it('should get all the custom attributes from the store', function () {
            customAttributeRepository.getAll();
            expect(mockStore.getAll).toHaveBeenCalled();
        });
    });
});