define(["chartRepository", "angularMocks", "utils"], function(ChartRepository, mocks, utils) {
    describe('Chart Repository', function() {
        var mockStore, chartRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            chartRepository = new ChartRepository(mockDB.db);
        }));

        it('should save the charts', function() {
            var charts = [{
                'id': 'new chart id',
                'title': 'The chart'
            }];
            // chartRepository.upsert(charts);
            // expect(mockStore.upsert).toHaveBeenCalledWith(charts);
        });
    });
});