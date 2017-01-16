define(['angularMocks', 'utils', 'indicatorRepository'], function (mocks, utils, IndicatorRepository) {
    var indicatorRepository, objectStore, mockDB, q, scope;
    describe('IndicatorRepository', function () {
        beforeEach(mocks.inject(function ($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            mockDB = utils.getMockDB(q);
            objectStore = mockDB.objectStore;
            indicatorRepository = new IndicatorRepository(mockDB.db, q);
        }));

        it('should getAll the indicators', function () {
            indicatorRepository.getAll();
            expect(objectStore.getAll).toHaveBeenCalled();
        });

        it('should enrich indicators from store', function () {
            var indicator = { id: 'someIndicatorId' };

            var indicatorsFromDB = [{
                id: 'someIndicatorId',
                shortName: 'shortName',
                name: 'someName',
                description: 'someDescription',
                numerator: 'someValue',
                denominator: 'someValue',
                someOtherField : 'someFieldValue'
            }];

            spyOn(indicatorRepository, 'getAll').and.returnValue(utils.getPromise(q, indicatorsFromDB));
            var expectedIndicator = {
                id: 'someIndicatorId',
                shortName: 'shortName',
                name: 'someName',
                description: 'someDescription',
                numerator: 'someValue',
                denominator: 'someValue'
            };

            indicatorRepository.enrichWithIndicatorDetails([indicator]).then(function (indicators) {
                expect(indicator).toEqual(expectedIndicator);
            });
            scope.$apply();
        });
    });
});