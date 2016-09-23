define(['chart'], function(Chart) {
    describe('Chart', function() {
        var chart, config;

        describe('create', function() {
            it('should create a chart with the required properties', function() {
                config = {
                    id: 'someId',
                    name: 'someName',
                    title: 'someTitle',
                    columns: 'someColumns',
                    filters: 'someFilters',
                    rows: 'someRows',
                    type: 'someType',
                    categoryDimensions: 'categoryDimensionInfo',
                    dataDimensionItems: 'dataDimensionItemInfo'
                };
                chart = Chart.create(config);
                expect(chart.id).toEqual(config.id);
                expect(chart.name).toEqual(config.name);
                expect(chart.title).toEqual(config.title);
                expect(chart.columns).toEqual(config.columns);
                expect(chart.filters).toEqual(config.filters);
                expect(chart.rows).toEqual(config.rows);
                expect(chart.type).toEqual(config.type);
                expect(chart.categoryDimensions).toEqual(config.categoryDimensions);
                expect(chart.dataDimensionItems).toEqual(config.dataDimensionItems);
            });
        });

        describe('dataSetCode', function() {
            it('should parse the dataSet code from the chart name', function() {
                chart = Chart.create({
                   name: '[FieldApp - DataSetCode] 1 someName'
               });
                expect(chart.dataSetCode).toEqual('DataSetCode');
            });

            it('should return null if chart name is malformed', function() {
                chart = Chart.create({
                    name: 'some malformed chart name'
                });
                expect(chart.dataSetCode).toBeNull();
            });
        });

        describe('geographicOriginChart', function() {
            it('should return true if chart name contains GeographicOrigin', function() {
                chart = Chart.create({ name: '[FieldApp - GeographicOrigin] # Name' });
                expect(chart.geographicOriginChart).toBeTruthy();
            });

            it('should return false if chart name does not contain GeographicOrigin', function() {
                chart = Chart.create({ name: 'some malformed chart name' });
                expect(chart.geographicOriginChart).toBeFalsy();
            });
        });

        describe('displayPosition', function() {
            it('should parse the position from the chart name', function() {
                chart = Chart.create({
                    'name': '[FieldApp - someDataSetCode] 88 Name'
                });
                expect(chart.displayPosition).toEqual(88);
            });

            it('should be null if the chart name is malformed', function() {
                chart = Chart.create({
                    'name': 'some malformed chart name'
                });
                expect(chart.displayPosition).toBeNull();
            });
        });

        describe('monthlyChart', function() {
            it('should return true if relativePeriod contains month', function() {
                chart = Chart.create({
                    'relativePeriods': {
                        last12Months: true
                    }
                });
                expect(chart.monthlyChart).toEqual(true);
            });

            it('should return false if relativePeriod does not contain month', function() {
                chart = Chart.create({
                    'relativePeriods': {
                        someOtherPeriod: true
                    }
                });
                expect(chart.monthlyChart).toEqual(false);
            });

            it('should return false if relativePeriods does not exist', function() {
                chart = Chart.create({});
                expect(chart.monthlyChart).toEqual(false);
            });
        });

        describe('weeklyChart', function() {
            it('should return true if relativePeriod does not contain month', function() {
                chart = Chart.create({
                    'relativePeriods': {
                        someOtherPeriod: true
                    }
                });
                expect(chart.weeklyChart).toEqual(true);
            });

            it('should return false if relativePeriod contains month', function() {
                chart = Chart.create({
                    'relativePeriods': {
                        last12Months: true
                    }
                });
                expect(chart.weeklyChart).toEqual(false);
            });

            it('should return true if relativePeriods does not exist', function() {
                chart = Chart.create({});
                expect(chart.weeklyChart).toEqual(true);
            });
        });
    });
});
