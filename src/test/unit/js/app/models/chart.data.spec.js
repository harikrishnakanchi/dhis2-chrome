define(['chartData', 'analyticsData'], function (ChartData, AnalyticsData) {
    describe('ChartData', function () {
        var chartData, definition, data, mockAnalyticsData;

        beforeEach(function () {
            definition = {
                id: 'someId',
                title: 'someTitle',
                type: 'someType',
                dataSetCode: 'someDataSetCode',
                displayPosition: 'someDisplayPosition',
                weeklyChart: 'someBooleanValue',
                monthlyChart: 'anotherBooleanValue'
            };
            data = 'mockPivotTableData';
            mockAnalyticsData = {
                rows: [['someRow']],
                columns: [['someColumn']],
                isDataAvailable: 'isDataAvailableBooleanValue',
                getDataValue: function() {},
                getDisplayName: function() {}
            };
            spyOn(AnalyticsData, 'create').and.returnValue(mockAnalyticsData);
        });

        describe('create', function () {
            it('should create object with the required properties', function() {
                chartData = ChartData.create(definition, data);

                expect(chartData.id).toEqual(definition.id);
                expect(chartData.title).toEqual(definition.title);
                expect(chartData.type).toEqual(definition.type);
                expect(chartData.dataSetCode).toEqual(definition.dataSetCode);
                expect(chartData.displayPosition).toEqual(definition.displayPosition);
                expect(chartData.weeklyChart).toEqual(definition.weeklyChart);
                expect(chartData.monthlyChart).toEqual(definition.monthlyChart);
            });
        });

        describe('creation of AnalyticsData instance', function() {
            it('should map the properties and functions of the analytics data model', function () {
                chartData = ChartData.create(definition, data);

                expect(chartData.categories).toEqual(_.first(mockAnalyticsData.rows));
                expect(chartData.series).toEqual(_.first(mockAnalyticsData.columns));
                expect(chartData.isDataAvailable).toEqual(mockAnalyticsData.isDataAvailable);
                expect(chartData.getDataValue).toEqual(mockAnalyticsData.getDataValue);
                expect(chartData.getDisplayName).toEqual(mockAnalyticsData.getDisplayName);
            });
        });
    });
});