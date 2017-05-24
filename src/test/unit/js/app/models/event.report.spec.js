define(['eventReport'], function (EventReport) {
    describe('EventReport', function () {
        var eventReport, config;

        describe('create', function () {
            beforeEach(function () {
                config = {
                    id: 'someId',
                    name: '[Praxis - IntensiveCareWard] 1 Event Report Title',
                    title: 'someTitle',
                    translations: [],
                    columns: 'columnInfo',
                    rows: 'rowInfo',
                    categoryDimensions: 'categoryDimensionInfo',
                    dataElementDimensions: 'dataElementDimensionInfo'
                };
            });

            it('should return an instance with required properties', function () {
                eventReport = EventReport.create(config);

                expect(eventReport.id).toEqual(config.id);
                expect(eventReport.name).toEqual(config.name);
                expect(eventReport.title).toEqual('Event Report Title');
                expect(eventReport.translations).toEqual(config.translations);
                expect(eventReport.columns).toEqual(config.columns);
                expect(eventReport.rows).toEqual(config.rows);

                expect(eventReport.categoryDimensions).toEqual(config.categoryDimensions);
                expect(eventReport.dataDimensionItems).toEqual(config.dataDimensionItems);
            });

            describe('serviceCode', function() {
                it('should parse the program code from the event report name', function() {
                    eventReport = EventReport.create(config);
                    expect(eventReport.serviceCode).toEqual('IntensiveCareWard');
                });

                it('should leave the program code as null if the event report name is malformed', function() {
                    eventReport = EventReport.create({ name: 'some malformed event report name' });
                    expect(eventReport.serviceCode).toBeNull();
                });
            });

            describe('displayPosition', function() {
                it('should parse the display position from the event report name', function() {
                    eventReport = EventReport.create(config);
                    expect(eventReport.displayPosition).toEqual(1);
                });

                it('should return false if the event report name is malformed', function() {
                    eventReport = EventReport.create({ name: 'some malformed event report name' });
                    expect(eventReport.displayPosition).toBeNull();
                });
            });

            describe('monthlyReport', function() {
                it('should return true if relativePeriods contains Months', function () {
                    eventReport = EventReport.create({ relativePeriods: { last12Months: true } });
                    expect(eventReport.monthlyReport).toBeTruthy();
                });

                it('should return false if relativePeriods does not contain Months', function () {
                    eventReport = EventReport.create({ relativePeriods: { anotherTimePeriod: true, last12Months: false } });
                    expect(eventReport.monthlyReport).toBeFalsy();
                });
            });

            describe('weeklyReport', function() {
                it('should return true if relativePeriods contain Weeks', function () {
                    eventReport = EventReport.create({ relativePeriods: { last12Weeks: true } });
                    expect(eventReport.weeklyReport).toBeTruthy();
                });

                it('should return false if relativePeriods does not contain Weeks', function () {
                    eventReport = EventReport.create({ relativePeriods: { anotherTimePeriod: true, last12Weeks: false } });
                    expect(eventReport.weeklyReport).toBeFalsy();
                });
            });
        });
    });
});
