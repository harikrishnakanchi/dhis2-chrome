define(['moduleDataBlockMerger', 'angularMocks', 'utils', 'moment', 'lodash', 'dataRepository', 'approvalDataRepository'],
    function(ModuleDataBlockMerger, mocks, utils, moment, _, DataRepository, ApprovalDataRepository) {
        describe('moduleDataBlockMerger', function() {
            var q, scope, moduleDataBlockMerger,
                dataRepository, approvalRepository,
                dhisDataValues, dhisCompletion, moduleDataBlock, someMomentInTime;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                dataRepository = new DataRepository();
                spyOn(dataRepository, 'saveDhisData').and.returnValue(utils.getPromise(q, {}));

                approvalRepository = new ApprovalDataRepository();
                spyOn(approvalRepository, 'saveApprovalsFromDhis').and.returnValue(utils.getPromise(q, {}));

                moduleDataBlockMerger = new ModuleDataBlockMerger(dataRepository, approvalRepository, q);

                moduleDataBlock = {};
                dhisDataValues = [];
                dhisCompletion = undefined;
                someMomentInTime = moment('2016-05-18T13:00:00.000Z');
            }));

            var createMockDataValue = function(options) {
                if(options && options.lastUpdated) {
                    options.lastUpdated = options.lastUpdated.toISOString();
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

            var createMockDhisCompletion = function() {
                return {
                    period: 'somePeriod',
                    orgUnit: 'someOrgUnit',
                    completedBy: 'some_l1_approver',
                    completedOn: '2016-05-05T09:00:00.000Z',
                    isComplete: true
                };
            };

            var performMerge = function() {
                moduleDataBlockMerger.mergeAndSaveToLocalDatabase(moduleDataBlock, dhisDataValues, dhisCompletion);
                scope.$apply();
            };

            describe('data or approvals exist only on DHIS', function () {
                it('should save DHIS data values to database', function() {
                    dhisDataValues = [
                        createMockDataValue()
                    ];

                    performMerge();

                    expect(dataRepository.saveDhisData).toHaveBeenCalledWith(dhisDataValues);
                });

                it('should save DHIS completions to database', function() {
                    dhisCompletion = createMockDhisCompletion();

                    performMerge();

                    expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisCompletion);
                });
            });

            describe('data and approvals do not exist on DHIS', function () {
                it('should not save any data values to database', function() {
                    dhisDataValues = [];
                    dhisCompletion = undefined;

                    performMerge();

                    expect(dataRepository.saveDhisData).not.toHaveBeenCalled();
                });

                it('should not save any DHIS completions to database', function() {
                    dhisDataValues = [];
                    dhisCompletion = undefined;

                    performMerge();

                    expect(approvalRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
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
