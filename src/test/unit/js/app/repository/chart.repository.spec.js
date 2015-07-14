define(["chartRepository", "angularMocks", "utils"], function(ChartRepository, mocks, utils) {
    describe('Chart Repository', function() {
        var mockStore, chartRepository, q;

        beforeEach(mocks.inject(function($q, $rootScope) {
            var mockDB = utils.getMockDB($q);
            q = $q;
            mockStore = mockDB.objectStore;
            chartRepository = new ChartRepository(mockDB.db);
        }));

        it('should save the charts', function() {
            var charts = [{
                'id': 'new chart id',
                'title': 'The chart'
            }];
            chartRepository.upsert(charts);
            expect(mockStore.upsert).toHaveBeenCalledWith(charts);
        });

        it('should save chart data', function() {
            var chart = {
                'id': 'new chart id',
                'name': 'The chart'
            };

            var orgUnit = {
                'id': 'orgUnitId'
            };

            var data = {
                'metaData': 'chartId'
            };

            chartRepository.upsertChartData('The chart', 'orgUnitId', data);

            expect(mockStore.upsert).toHaveBeenCalledWith({
                chart: 'The chart',
                orgUnit: 'orgUnitId',
                data: data
            });
        });

        it('should transform the chartData', function() {
            var data = [{"metaData": "some"}];
            var chartData = [{'orgUnit': 'orgUnitId', 'chart': 'chart id', data: data}];
            mockStore.each.and.returnValue(utils.getPromise(q, chartData));
            var result = chartRepository.getDataForChart({'id': 'chart id'}, 'orgUnitId').then(function(result){
                expect(result).toEqual(data);
            });
        });

        it('should get All the charts', function() {
            chartRepository.getAll();
            expect(mockStore.getAll).toHaveBeenCalled();
        });
    });
});