define(['downloadChartConsumer', 'angularMocks', 'utils'], function(DownloadChartConsumer, mocks, utils) {
    describe('Download Charts Consumer', function() {
        var downloadChartConsumer, chartService, chartRepository, orgUnitRepository, scope, q;
        beforeEach(mocks.inject(function($q, $rootScope) {
            scope = $rootScope;
            q = $q;
            chartService = jasmine.createSpyObj('chartService', ['getChartDataForOrgUnit', 'getAllFieldAppCharts', 'getChartDataForOrgUnit']);
            chartRepository = jasmine.createSpyObj('chartRepository', ['upsertChartData', 'upsert']);
            orgUnitRepository = jasmine.createSpyObj('orgUnitRepository', ['getAllModules']);

            downloadChartConsumer = new DownloadChartConsumer(chartService, chartRepository, orgUnitRepository, $q);
        
        }));

        it('should download all charts', function() {
            var charts = [{
                id: 'Chart 1'
            }];
            var allChartsResponse = {
                data: {
                    charts: charts
                }
            };
            chartService.getAllFieldAppCharts.and.returnValue(utils.getPromise(q, allChartsResponse));
            chartRepository.upsert.and.returnValue(utils.getPromise(q, allChartsResponse));
            orgUnitRepository.getAllModules.and.returnValue(utils.getPromise(q, []));
            downloadChartConsumer.run();
            scope.$apply();
            expect(chartRepository.upsert).toHaveBeenCalledWith(charts);
        });

        it('should get data for each of the charts', function() {
            var chart1 = {
                id: 'Chart 1'
            };
            var orgUnit1 = {
                id: 'unit 1'
            };
            var charts = [chart1];

            var orgUnits = [orgUnit1];
            var allChartsResponse = {
                data: {
                    charts: charts
                }
            };
            var chartData = "chart data";
            chartService.getAllFieldAppCharts.and.returnValue(utils.getPromise(q, allChartsResponse));
            chartService.getChartDataForOrgUnit.and.returnValue(utils.getPromise(q, chartData));
            chartRepository.upsert.and.returnValue(utils.getPromise(q, allChartsResponse));
            orgUnitRepository.getAllModules.and.returnValue(utils.getPromise(q, orgUnits));
            downloadChartConsumer.run();
            scope.$apply();
            expect(chartService.getChartDataForOrgUnit).toHaveBeenCalledWith(chart1, orgUnit1.id);
            expect(chartRepository.upsertChartData).toHaveBeenCalledWith(chart1, orgUnit1, chartData);
        });
    });
});