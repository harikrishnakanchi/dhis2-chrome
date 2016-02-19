define(["chartRepository", "angularMocks", "utils", "lodash"], function(ChartRepository, mocks, utils, _) {
    describe('Chart Repository', function() {
        var mockStore, chartRepository, q, mockDB;

        beforeEach(mocks.inject(function($q, $rootScope) {
            mockDB = utils.getMockDB($q);
            q = $q;
            scope = $rootScope.$new();
            mockStore = mockDB.objectStore;

            chartRepository = new ChartRepository(mockDB.db, q);
        }));

        describe('getAll', function() {
            it('should get all the charts', function() {
                var allCharts = [{
                    'id': 'chart1',
                    'name': '[FieldApp - dataSetCode] # Name'
                }, {
                    'id': 'chart2',
                    'name': '[FieldApp - dataSetCode] # Name'
                }];
                mockStore.getAll.and.returnValue(utils.getPromise(q, allCharts));

                chartRepository.getAll().then(function(chartsFromRepository) {
                    expect(_.pluck(chartsFromRepository, 'id')).toEqual(['chart1', 'chart2']);
                });
                scope.$apply();

                expect(mockStore.getAll).toHaveBeenCalled();
            });
        });

        it('should upsert the charts', function() {
            var chartsToUpsert = [{
                'id': 'newChartId',
                'title': 'New Chart'
            }, {
                'id': 'existingChartId',
                'title': 'Updated Chart'
            }];

            chartRepository.upsert(chartsToUpsert);
            scope.$apply();

            expect(mockStore.upsert).toHaveBeenCalledWith(chartsToUpsert);
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
            var data = [{
                "metaData": "some"
            }];
            var chartData = [{
                'orgUnit': 'orgUnitId',
                'chart': 'chart id',
                data: data
            }];
            mockStore.each.and.returnValue(utils.getPromise(q, chartData));
            var result = chartRepository.getDataForChart({
                'id': 'chart id'
            }, 'orgUnitId').then(function(result) {
                expect(result).toEqual(data);
            });
        });

        it('should get All notification charts', function() {
            var allCharts = [{
                "name": "chart 1",
                "id": "1"
            }, {
                "name": "chart 2 Notifications",
                "id": "1"
            }, {
                "name": "chart 3 Notifications",
                "id": "1"
            }];

            mockStore.getAll.and.returnValue(utils.getPromise(q, allCharts));

            chartRepository.getAllChartsForNotifications().then(function(result) {
                expect(result).toEqual([allCharts[1], allCharts[2]]);
            });
            scope.$apply();
            expect(mockStore.getAll).toHaveBeenCalled();
        });

        it('should remove all charts by id', function() {
            var chartIds = ['1', '2'];
            var dbCharts = [{
                "name": "chart 1",
                "id": "1"
            }, {
                "name": "chart 2",
                "id": "2"
            }, {
                "name": "chart 3",
                "id": "3"
            }];
            chartRepository.deleteMultipleChartsById(chartIds, dbCharts);
            expect(mockStore.delete).toHaveBeenCalledWith('chart 1');
            expect(mockStore.delete).toHaveBeenCalledWith('chart 2');
        });
    });
});
