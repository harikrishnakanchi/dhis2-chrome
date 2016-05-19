define(['moduleDataBlockMerger', 'angularMocks', 'utils', 'moment', 'lodash', 'dataRepository', 'approvalDataRepository', 'mergeBy'],
    function(ModuleDataBlockMerger, mocks, utils, moment, _, DataRepository, ApprovalDataRepository, MergeBy) {
        describe('moduleDataBlockMerger', function() {
            var q, scope, moduleDataBlockMerger,
                dataRepository, approvalRepository, mergeBy,
                dhisDataValues, dhisCompletion, dhisApproval, moduleDataBlock, someMomentInTime;

            beforeEach(mocks.inject(function($q, $rootScope, $log) {
                q = $q;
                scope = $rootScope.$new();

                dataRepository = new DataRepository();
                spyOn(dataRepository, 'saveDhisData').and.returnValue(utils.getPromise(q, {}));

                approvalRepository = new ApprovalDataRepository();
                spyOn(approvalRepository, 'saveApprovalsFromDhis').and.returnValue(utils.getPromise(q, {}));

                mergeBy = new MergeBy($log);

                moduleDataBlockMerger = new ModuleDataBlockMerger(dataRepository, approvalRepository, mergeBy, q);

                moduleDataBlock = {};
                dhisDataValues = [];
                dhisCompletion = undefined;
                dhisApproval = undefined;
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

            var createMockDhisApproval = function() {
                return {
                    period: 'somePeriod',
                    orgUnit: 'someOrgUnit',
                    approvedBy: 'some_l2_approver',
                    approvedOn: '2016-05-06T09:00:00.000Z',
                    isApproved: true
                };
            };

            var performMerge = function() {
                moduleDataBlockMerger.mergeAndSaveToLocalDatabase(moduleDataBlock, dhisDataValues, dhisCompletion, dhisApproval);
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

                it('should save DHIS completion to database', function() {
                    dhisCompletion = createMockDhisCompletion();

                    performMerge();

                    expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisCompletion);
                });

                it('should save DHIS approval to database', function() {
                    dhisApproval = createMockDhisApproval();

                    performMerge();

                    expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisApproval);
                });

                it('should merge and save DHIS completion and approval to database', function() {
                    dhisCompletion = createMockDhisCompletion();
                    dhisApproval = createMockDhisApproval();

                    performMerge();

                    var expectedPayload = _.merge({}, dhisCompletion, dhisApproval);
                    expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(expectedPayload);
                });
            });

            describe('data and approvals do not exist on DHIS', function () {
                it('should not save any data values to database', function() {
                    dhisDataValues = [];
                    dhisCompletion = undefined;
                    dhisApproval = undefined;

                    performMerge();

                    expect(dataRepository.saveDhisData).not.toHaveBeenCalled();
                });

                it('should not save any DHIS completions or approvals to database', function() {
                    dhisDataValues = [];
                    dhisCompletion = undefined;
                    dhisApproval = undefined;

                    performMerge();

                    expect(approvalRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
                });
            });

            describe('data is present on DHIS and Praxis', function () {
                it('should merge and save DHIS data values to database', function() {
                    var dhisDataValueA = createMockDataValue({ dataElement: 'dataElementA', lastUpdated: someMomentInTime }),
                        dhisDataValueB = createMockDataValue({ dataElement: 'dataElementB', lastUpdated: moment(someMomentInTime).subtract(1, 'hour') }),
                        localDataValueA = createMockDataValue({ dataElement: 'dataElementA', clientLastUpdated: moment(someMomentInTime).subtract(1, 'hour') }),
                        localDataValueB = createMockDataValue({ dataElement: 'dataElementB', clientLastUpdated: someMomentInTime });

                    dhisDataValues = [dhisDataValueA, dhisDataValueB];
                    moduleDataBlock = {
                        dataValues: [localDataValueA, localDataValueB]
                    };

                    performMerge();

                    expect(dataRepository.saveDhisData).toHaveBeenCalledWith([dhisDataValueA, localDataValueB]);
                });
            });
        });
    });
