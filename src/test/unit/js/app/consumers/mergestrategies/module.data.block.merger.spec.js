define(['moduleDataBlockMerger', 'angularMocks', 'moment', 'lodash', 'dataRepository'],
    function(ModuleDataBlockMerger, mocks, moment, _, DataRepository) {
        describe('moduleDataBlockMerger', function() {
            var q, scope, moduleDataBlockMerger,
                dataRepository,
                dhisDataValues, moduleDataBlock, someMomentInTime;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                dataRepository = new DataRepository();
                spyOn(dataRepository, 'saveDhisData');

                moduleDataBlockMerger = new ModuleDataBlockMerger(dataRepository, q);

                moduleDataBlock = {};
                dhisDataValues = [];
                someMomentInTime = moment('2016-05-18T13:00:00.000Z');
            }));

            var createMockDataValue = function(options) {
                if(options && options.lastUpdated) {
                    options.lastUpdated = options.lastUpdated.toISOString();
                }
                return _.merge({
                    dataElement: "someDataElementId",
                    period: "somePeriod",
                    orgUnit: "someOrgUnit",
                    categoryOptionCombo: "someCategoryOptionComboId",
                    lastUpdated: "2016-05-04T09:00:00.000Z",
                    value: "someValue"
                }, options);
            };

            var performMerge = function() {
                moduleDataBlockMerger.mergeAndSaveToLocalDatabase(moduleDataBlock, dhisDataValues);
            };

            describe('data exists only on DHIS', function () {
                it('should save DHIS data values to database', function() {
                    dhisDataValues = [
                        createMockDataValue()
                    ];

                    performMerge();

                    expect(dataRepository.saveDhisData).toHaveBeenCalledWith(dhisDataValues);
                });
            });

            describe('data exists only on Praxis', function () {
                it('should not save any data values to database', function() {
                    moduleDataBlock = {
                        dataValuesLastUpdated: moment(someMomentInTime)
                    };

                    performMerge();

                    expect(dataRepository.saveDhisData).not.toHaveBeenCalledWith(dhisDataValues);
                });
            });

            describe('data on DHIS is more recent than Praxis', function () {
                it('should save DHIS data values to database', function() {
                    dhisDataValues = [
                        createMockDataValue({ lastUpdated: someMomentInTime })
                    ];
                    moduleDataBlock = {
                        dataValuesLastUpdated: moment(someMomentInTime).subtract(1, 'hour')
                    };

                    performMerge();

                    expect(dataRepository.saveDhisData).toHaveBeenCalledWith(dhisDataValues);
                });
            });

            describe('data on Praxis is more recent than DHIS', function () {
                it('should not save any data values to database', function() {
                    dhisDataValues = [
                        createMockDataValue({ lastUpdated: someMomentInTime })
                    ];
                    moduleDataBlock = {
                        dataValuesLastUpdated: moment(someMomentInTime).add(1, 'hour')
                    };

                    performMerge();

                    expect(dataRepository.saveDhisData).not.toHaveBeenCalledWith(dhisDataValues);
                });
            });
        });
    });
