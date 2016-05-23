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
                spyOn(approvalRepository, 'invalidateApproval').and.returnValue(utils.getPromise(q, {}));

                mergeBy = new MergeBy($log);

                moduleDataBlockMerger = new ModuleDataBlockMerger(dataRepository, approvalRepository, mergeBy, q);

                moduleDataBlock = {};
                dhisDataValues = undefined;
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

            var createMockModuleDataBlock = function(options) {
                if(options && options.dataValuesLastUpdated) {
                    options.dataValuesLastUpdated = options.dataValuesLastUpdated.toISOString();
                }
                return _.merge({
                    period: 'somePeriod',
                    moduleId: 'someModuleId',
                    dataValuesLastUpdated: '2016-05-07T09:00:00.000Z',
                    dataValuesLastUpdatedOnDhis: null,
                    approvedAtProjectLevel: false,
                    approvedAtCoordinationLevel: false
                }, options);
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

            describe('data and approvals exist only on Praxis', function () {
                it('should not save any data values to database', function() {
                    dhisDataValues = undefined;
                    dhisCompletion = undefined;
                    dhisApproval = undefined;
                    moduleDataBlock = createMockModuleDataBlock({
                        dataValuesLastUpdated: someMomentInTime,
                        approvedAtProjectLevel: true,
                        approvedAtCoordinationLevel: true
                    });

                    performMerge();

                    expect(dataRepository.saveDhisData).not.toHaveBeenCalled();
                });

                it('should not invalidate or save any DHIS completions or approvals to database', function() {
                    dhisDataValues = undefined;
                    dhisCompletion = undefined;
                    dhisApproval = undefined;
                    moduleDataBlock = createMockModuleDataBlock({
                        dataValuesLastUpdated: someMomentInTime,
                        approvedAtProjectLevel: true,
                        approvedAtCoordinationLevel: true
                    });

                    performMerge();

                    expect(approvalRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
                    expect(approvalRepository.invalidateApproval).not.toHaveBeenCalled();
                });
            });

            describe('data is present on DHIS and Praxis', function () {
                it('should merge and save DHIS data values to database', function() {
                    var dhisDataValueA = createMockDataValue({ dataElement: 'dataElementA', lastUpdated: someMomentInTime }),
                        dhisDataValueB = createMockDataValue({ dataElement: 'dataElementB', lastUpdated: moment(someMomentInTime).subtract(1, 'hour') }),
                        localDataValueA = createMockDataValue({ dataElement: 'dataElementA', clientLastUpdated: moment(someMomentInTime).subtract(1, 'hour') }),
                        localDataValueB = createMockDataValue({ dataElement: 'dataElementB', clientLastUpdated: someMomentInTime });

                    dhisDataValues = [dhisDataValueA, dhisDataValueB];
                    moduleDataBlock = createMockModuleDataBlock({ dataValues: [localDataValueA, localDataValueB] });

                    performMerge();

                    expect(dataRepository.saveDhisData).toHaveBeenCalledWith([dhisDataValueA, localDataValueB]);
                });

                describe('data on DHIS is more recent than approved data in Praxis', function() {
                    it('should invalidate the approvals in Praxis', function() {
                        dhisDataValues = [
                            createMockDataValue({ lastUpdated: someMomentInTime })
                        ];
                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesLastUpdated: moment(someMomentInTime).subtract(1, 'hour'),
                            approvedAtProjectLevel: true,
                            approvedAtCoordinationLevel: true
                        });

                        performMerge();

                        expect(approvalRepository.invalidateApproval).toHaveBeenCalledWith(moduleDataBlock.period, moduleDataBlock.moduleId);
                    });
                });

                describe('data exists in DHIS, no data exists in Praxis, but Praxis module was previously auto-approved', function() {
                    it('should invalidate the approvals in Praxis', function() {
                        dhisDataValues = [
                            createMockDataValue({ lastUpdated: someMomentInTime })
                        ];
                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesLastUpdated: null,
                            approvedAtProjectLevel: true,
                            approvedAtCoordinationLevel: true
                        });

                        performMerge();

                        expect(approvalRepository.invalidateApproval).toHaveBeenCalledWith(moduleDataBlock.period, moduleDataBlock.moduleId);
                    });
                });

                describe('data on Praxis is more recent than approved data in DHIS', function() {
                    it('should not save or invalidate DHIS completion or approval data to database', function() {
                        dhisDataValues = [
                            createMockDataValue({ lastUpdated: moment(someMomentInTime).subtract(1, 'hour') })
                        ];
                        dhisCompletion = createMockDhisCompletion();
                        dhisApproval = createMockDhisApproval();
                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesLastUpdated: someMomentInTime
                        });

                        performMerge();

                        expect(approvalRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
                        expect(approvalRepository.invalidateApproval).not.toHaveBeenCalled();
                    });
                });
            });

            describe('data from DHIS has previously been downloaded and there are no updates in DHIS or Praxis', function () {
                it('should save DHIS completion and approval data to database', function() {
                        dhisDataValues = undefined;
                        dhisCompletion = createMockDhisCompletion();
                        dhisApproval = createMockDhisApproval();
                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesLastUpdated: someMomentInTime,
                            dataValuesLastUpdatedOnDhis: someMomentInTime
                        });

                        performMerge();

                        expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalled();
                    });
            });
        });
    });
