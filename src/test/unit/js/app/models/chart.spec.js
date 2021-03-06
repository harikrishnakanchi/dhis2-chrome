define(['chart'], function(Chart) {
    describe('Chart', function() {
        var chart, config;

        describe('create', function() {
            it('should create a chart with the required properties', function() {
                config = {
                    id: 'someId',
                    name: 'someName',
                    title: 'someTitle',
                    translations: [],
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
                expect(chart.translations).toEqual(config.translations);
                expect(chart.columns).toEqual(config.columns);
                expect(chart.filters).toEqual(config.filters);
                expect(chart.rows).toEqual(config.rows);
                expect(chart.type).toEqual(config.type);
                expect(chart.categoryDimensions).toEqual(config.categoryDimensions);
                expect(chart.dataDimensionItems).toEqual(config.dataDimensionItems);
            });
        });

        describe('serviceCode', function() {
            it('should parse the dataSet code from the chart name', function() {
                chart = Chart.create({
                   name: '[Praxis - ServiceCode] 1 someName'
               });
                expect(chart.serviceCode).toEqual('ServiceCode');
            });

            it('should return null if chart name is malformed', function() {
                chart = Chart.create({
                    name: 'some malformed chart name'
                });
                expect(chart.serviceCode).toBeNull();
            });
        });

        describe('geographicOriginChart', function() {
            it('should return true if is a GeographicOrigin chart for aggregate', function () {
                chart = Chart.create({name: '[Praxis - GeographicOrigin] # Name'});
                expect(chart.geographicOriginChart).toBeTruthy();
            });

            it('should return true if is a GeographicOrigin chart for lineList', function () {
                chart = Chart.create({name: '[Praxis - someProgramCode] # GeographicOrigin'});
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
                    'name': '[Praxis - someServiceCode] 88 Name'
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
                chart = Chart.create({ relativePeriods: { last12Months: true } });
                expect(chart.monthlyChart).toEqual(true);
            });

            it('should return false if relativePeriod does not contain month', function() {
                chart = Chart.create({ relativePeriods: { someOtherPeriod: true } });
                expect(chart.monthlyChart).toEqual(false);
            });
        });

        describe('weeklyChart', function() {
            it('should return true if relativePeriod contains week', function() {
                chart = Chart.create({ relativePeriods: { last12Weeks: true } });
                expect(chart.weeklyChart).toEqual(true);
            });

            it('should return false if relativePeriod does not contain week', function() {
                chart = Chart.create({ relativePeriods: { someOtherKey: true } });
                expect(chart.weeklyChart).toEqual(false);
            });
        });

        describe('yearlyChart', function() {
            it('should return true if relativePeriod does not contain month or week', function() {
                chart = Chart.create({ relativePeriods: { last12Weeks: false } });
                expect(chart.yearlyChart).toEqual(true);
            });

            it('should return false if relativePeriod contains month or week', function() {
                chart = Chart.create({ relativePeriods: { last12Months: true } });
                expect(chart.yearlyChart).toEqual(false);
            });
        });
    });
});
