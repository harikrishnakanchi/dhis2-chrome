define(["chartRepository", "chart", "chartData", "angularMocks", "utils", "lodash"], function(ChartRepository, Chart, ChartData, mocks, utils, _) {
    describe('Chart Repository', function() {
        var mockStore, chartRepository, q, mockDB, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            mockDB = utils.getMockDB($q);
            q = $q;
            scope = $rootScope.$new();
            mockStore = mockDB.objectStore;
            spyOn(ChartData, 'create').and.returnValue({});

            chartRepository = new ChartRepository(mockDB.db, q);
        }));

        describe('getAll', function() {
            it('should return all the charts', function() {
                var allCharts = [{
                    id: 'chart1'
                }, {
                    id: 'chart2'
                }];
                mockStore.getAll.and.returnValue(utils.getPromise(q, allCharts));

                chartRepository.getAll().then(function(chartsFromRepository) {
                    expect(_.pluck(chartsFromRepository, 'id')).toEqual(['chart1', 'chart2']);
                });
                scope.$apply();

                expect(mockStore.getAll).toHaveBeenCalled();
            });

            it('should return instances of the Chart model', function() {
                mockStore.getAll.and.returnValue(utils.getPromise(q, [{ id: 'chartId' }]));

                chartRepository.getAll().then(function(chartsFromRepository) {
                    expect(_.first(chartsFromRepository)).toEqual(jasmine.any(Chart));
                });
                scope.$apply();
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
            var chartIdA = 'chartIdA',
                chartIdB = 'chartIdB';

            chartRepository.deleteMultipleChartsById([chartIdA, chartIdB]);
            expect(mockStore.delete).toHaveBeenCalledWith(chartIdA);
            expect(mockStore.delete).toHaveBeenCalledWith(chartIdB);
        });

        describe('getChartData', function () {
            var orgUnitId, mockChartData, mockChartDataModel, chartDefinition;

            beforeEach(function () {
                orgUnitId = 'someOrgUnitId';
                mockChartData = {
                    data: 'someData'
                };
                mockChartDataModel = 'someInstanceOfModel';
                chartDefinition = {
                    name: 'someChartName'
                };

                mockStore.find.and.returnValue(utils.getPromise(q, mockChartData));
                ChartData.create.and.returnValue(mockChartDataModel);
            });

            it('should get the chartData for the specified chart and orgUnit', function () {
                chartRepository.getChartData(chartDefinition, orgUnitId).then(function (chartData) {
                    expect(chartData).toEqual(mockChartDataModel);
                });

                scope.$apply();
                expect(mockStore.find).toHaveBeenCalledWith([chartDefinition.name, orgUnitId]);
                expect(ChartData.create).toHaveBeenCalledWith(chartDefinition, mockChartData.data);
            });

            it('should return null if the chartData does not exist', function () {
                mockStore.find.and.returnValue(utils.getPromise(q, null));

                chartRepository.getChartData(chartDefinition, orgUnitId).then(function (chartData) {
                    expect(chartData).toBeNull();
                });

                scope.$apply();
            });
        });
    });
});
