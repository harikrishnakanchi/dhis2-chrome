define(['moduleDataBlockMerger', 'angularMocks', 'dataRepository'],
    function(ModuleDataBlockMerger, mocks, DataRepository) {
        describe('moduleDataBlockMerger', function() {
            var q, scope, moduleDataBlockMerger,
                dataRepository,
                dhisDataValues, moduleDataBlock;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                dataRepository = new DataRepository();
                spyOn(dataRepository, 'saveDhisData');

                moduleDataBlockMerger = new ModuleDataBlockMerger(dataRepository, q);

                moduleDataBlock = {};
                dhisDataValues = [];
            }));

            var createMockDataValue = function(options) {
                return {
                    "dataElement": "someDataElementId",
                    "period": "somePeriod",
                    "orgUnit": "someOrgUnit",
                    "categoryOptionCombo": "someCategoryOptionComboId",
                    "lastUpdated": "2016-05-04T09:00:00.000Z",
                    "value": "someValue"
                };
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
                    dhisDataValues = [];

                    performMerge();

                    expect(dataRepository.saveDhisData).not.toHaveBeenCalledWith(dhisDataValues);
                });
            });
        });
    });
