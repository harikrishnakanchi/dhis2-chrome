define(['aggregateDataValuesMerger', 'mergeBy', 'moment', 'angularMocks'], function (AggregateDataValuesMerger, MergeBy, moment, mocks) {
    describe('aggregateDataValuesMerger', function () {

        var aggregateDataValuesMerger,
            merger,
            updatedDhisDataValues,
            praxisDataValues,
            someMomentInTime,
            someOlderMomentInTime;

        beforeEach(mocks.inject(function ($log) {
            updatedDhisDataValues = undefined;
            praxisDataValues = undefined;
            someMomentInTime = moment('2016-06-24T13:00:00.000Z');
            someOlderMomentInTime = moment('2016-06-23T13:00:00.000Z');
            mergeBy = new MergeBy($log);

            aggregateDataValuesMerger = new AggregateDataValuesMerger(mergeBy);
        }));

        var createMerger = function() {
            return aggregateDataValuesMerger.create(praxisDataValues, updatedDhisDataValues);
        };

        var createMockDataValue = function (options) {
            if (options && options.lastUpdated) {
                options.lastUpdated = options.lastUpdated.toISOString();
            }
            if (options && options.clientLastUpdated) {
                options.clientLastUpdated = options.clientLastUpdated.toISOString();
            }
            return _.merge({
                dataElement: 'someDataElementId',
                period: 'somePeriod',
                orgUnit: 'someOrgUnit',
                categoryOptionCombo: 'someCategoryOptionComboId',
                lastUpdated: '2016-05-04T09:00:00.000Z',
                value: 'someValue'
            }, options);
        };

        describe('data exists only on DHIS', function () {
            it('should return the DHIS data', function () {
                updatedDhisDataValues = [createMockDataValue()];

                merger = createMerger();

                expect(merger.mergedData).toEqual(updatedDhisDataValues);
                expect(merger.praxisAndDhisAreBothUpToDate).toBeFalsy();
                expect(merger.dhisIsUpToDateAndPraxisIsOutOfDate).toBeTruthy();
                expect(merger.praxisAndDhisAreBothOutOfDate).toBeFalsy();
            });
        });

        describe('new data exists only on Praxis', function () {
            it('should return the Praxis data', function(){
                praxisDataValues = [createMockDataValue({ clientLastUpdated: someOlderMomentInTime })];

                merger = createMerger();

                expect(merger.mergedData).toEqual(praxisDataValues);
                expect(merger.praxisAndDhisAreBothUpToDate).toBeFalsy();
                expect(merger.dhisIsUpToDateAndPraxisIsOutOfDate).toBeFalsy();
                expect(merger.praxisAndDhisAreBothOutOfDate).toBeFalsy();
            });
        });

        describe('modified data exists on both Praxis and DHIS', function() {
            it('should merge the Praxis and DHIS data', function() {
                var dhisDataValueA = createMockDataValue({ dataElement: 'dataElementA', value: 'newValueA', lastUpdated: someMomentInTime }),
                    dhisDataValueB = createMockDataValue({ dataElement: 'dataElementB', value: 'oldValueB', lastUpdated: someOlderMomentInTime }),
                    praxisDataValueA = createMockDataValue({ dataElement: 'dataElementA', value: 'oldValueA', clientLastUpdated: someOlderMomentInTime }),
                    praxisDataValueB = createMockDataValue({ dataElement: 'dataElementB', value: 'newValueB', clientLastUpdated: someMomentInTime });

                updatedDhisDataValues = [dhisDataValueA, dhisDataValueB];
                praxisDataValues = [praxisDataValueA, praxisDataValueB];

                merger = createMerger();

                expect(merger.mergedData).toEqual([dhisDataValueA, praxisDataValueB]);
                expect(merger.praxisAndDhisAreBothUpToDate).toBeFalsy();
                expect(merger.dhisIsUpToDateAndPraxisIsOutOfDate).toBeFalsy();
                expect(merger.praxisAndDhisAreBothOutOfDate).toBeTruthy();
            });
        });

        describe('updated data exists on DHIS', function() {
            it('should return the merged Praxis and DHIS data', function() {
                var dhisDataValue = createMockDataValue({ value: 'newValue', lastUpdated: someMomentInTime }),
                    praxisDataValue = createMockDataValue({ value: 'oldValue', clientLastUpdated: someOlderMomentInTime });

                updatedDhisDataValues = [dhisDataValue];
                praxisDataValues = [praxisDataValue];

                merger = createMerger();

                expect(merger.mergedData).toEqual([dhisDataValue]);
                expect(merger.praxisAndDhisAreBothUpToDate).toBeFalsy();
                expect(merger.dhisIsUpToDateAndPraxisIsOutOfDate).toBeTruthy();
                expect(merger.praxisAndDhisAreBothOutOfDate).toBeFalsy();
            });
        });

        describe('same data exists on both Praxis and DHIS', function (){
            it('should return the merged Praxis or DHIS data', function () {
                var dhisDataValue = createMockDataValue({ lastUpdated: someMomentInTime }),
                    praxisDataValue = createMockDataValue({ clientLastUpdated: someOlderMomentInTime });

                updatedDhisDataValues = [dhisDataValue];
                praxisDataValues = [praxisDataValue];

                merger = createMerger();

                expect(merger.mergedData).toEqual(updatedDhisDataValues);
                expect(merger.praxisAndDhisAreBothUpToDate).toBeTruthy();
                expect(merger.dhisIsUpToDateAndPraxisIsOutOfDate).toBeFalsy();
                expect(merger.praxisAndDhisAreBothOutOfDate).toBeFalsy();
            });
        });

        describe('updatedDhisDataValuesExist', function() {
            it('should return true if there are any updated data values from Dhis', function() {
                updatedDhisDataValues = [createMockDataValue()];
                merger = createMerger();

                expect(merger.updatedDhisDataValuesExist).toBeTruthy();
            });

            it('should return false if there are no updated data values from Dhis', function() {
                updatedDhisDataValues = [];
                merger = createMerger();

                expect(merger.updatedDhisDataValuesExist).toBeFalsy();
            });
        });
    });
});