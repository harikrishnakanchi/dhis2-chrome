define(['moduleDataBlockMerger', 'dataRepository', 'approvalDataRepository', 'datasetRepository', 'dataService', 'approvalService', 'angularMocks', 'utils', 'moment', 'lodash', 'mergeBy', 'dataSyncFailureRepository'],
    function(ModuleDataBlockMerger, DataRepository, ApprovalDataRepository, DatasetRepository, DataService, ApprovalService, mocks, utils, moment, _ , MergeBy, DataSyncFailureRepository) {
        describe('moduleDataBlockMerger', function() {
            var q, scope, moduleDataBlockMerger,
                dataRepository, approvalRepository, datasetRepository, dataService, approvalService, mergeBy,
                dhisDataValues, dhisCompletion, dhisApproval, moduleDataBlock, someMomentInTime, dataSets, dataSetIds, periodAndOrgUnit, dataSyncFailureRepository;

            beforeEach(mocks.inject(function($q, $rootScope, $log) {
                q = $q;
                scope = $rootScope.$new();

                dataRepository = new DataRepository();
                spyOn(dataRepository, 'saveDhisData').and.returnValue(utils.getPromise(q, {}));
                spyOn(dataRepository, 'clearFailedToSync').and.returnValue(utils.getPromise(q, {}));

                approvalRepository = new ApprovalDataRepository();
                spyOn(approvalRepository, 'saveApprovalsFromDhis').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalRepository, 'invalidateApproval').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalRepository, 'clearFailedToSync').and.returnValue(utils.getPromise(q, {}));

                dataSets = [{
                    id: 'dataSetid1'
                }, {
                    id: 'dataSetid2'
                }];
                dataSetIds = _.pluck(dataSets, "id");
                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'getAll').and.returnValue(utils.getPromise(q, dataSets));

                dataService = new DataService();
                spyOn(dataService, 'save').and.returnValue(utils.getPromise(q, {}));

                approvalService = new ApprovalService();
                spyOn(approvalService, 'markAsComplete').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalService, 'markAsApproved').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalService, 'markAsIncomplete').and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalService, 'markAsUnapproved').and.returnValue(utils.getPromise(q, {}));

                dataSyncFailureRepository = new DataSyncFailureRepository();
                spyOn(dataSyncFailureRepository, 'delete').and.returnValue(utils.getPromise(q, undefined));

                mergeBy = new MergeBy($log);

                moduleDataBlockMerger = new ModuleDataBlockMerger(dataRepository, approvalRepository, mergeBy, dataService, q, datasetRepository, approvalService, dataSyncFailureRepository);

                moduleDataBlock = createMockModuleDataBlock();
                dhisDataValues = undefined;
                dhisCompletion = undefined;
                dhisApproval = undefined;
                someMomentInTime = moment('2016-05-18T13:00:00.000Z');
            }));

            var createMockDataValue = function(options) {
                if(options && options.lastUpdated) {
                    options.lastUpdated = options.lastUpdated.toISOString();
                }
                if(options && options.clientLastUpdated) {
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

            var createMockCompletion = function() {
                return {
                    period: 'somePeriod',
                    orgUnit: 'someOrgUnit',
                    completedBy: 'some_l1_approver',
                    completedOn: '2016-05-05T09:00:00.000Z',
                    isComplete: true
                };
            };

            var createMockApproval = function() {
                return {
                    period: 'somePeriod',
                    orgUnit: 'someOrgUnit',
                    approvedBy: 'some_l2_approver',
                    approvedOn: '2016-05-06T09:00:00.000Z',
                    isApproved: true
                };
            };

            var createMockModuleDataBlock = function(options) {
                return _.merge({
                    period: 'somePeriod',
                    moduleId: 'someModuleId',
                    lineListService: false,
                    failedToSync: false,
                    approvalData: null,
                    dataValues: [],
                    dataValuesHaveBeenModifiedLocally: false,
                    approvedAtProjectLevel: false,
                    approvedAtProjectLevelBy: null,
                    approvedAtProjectLevelAt: null,
                    approvedAtCoordinationLevel: false,
                    approvedAtCoordinationLevelBy: null,
                    approvedAtCoordinationLevelAt: null
                }, options);
            };

            describe('mergeAndSaveToLocalDatabase', function() {
                var performMerge = function() {
                    moduleDataBlockMerger.mergeAndSaveToLocalDatabase(moduleDataBlock, dhisDataValues, dhisCompletion, dhisApproval);
                    scope.$apply();
                };

                describe('data or approvals exist only on DHIS', function () {
                    it('should save DHIS data values to database', function() {
                        dhisDataValues = [createMockDataValue()];

                        performMerge();

                        expect(dataRepository.saveDhisData).toHaveBeenCalledWith(dhisDataValues);
                    });

                    it('should save DHIS completion to database', function() {
                        dhisCompletion = createMockCompletion();

                        performMerge();

                        expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisCompletion);
                    });

                    it('should save DHIS approval to database', function() {
                        dhisApproval = createMockApproval();

                        performMerge();

                        expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(dhisApproval);
                    });

                    it('should merge and save DHIS completion and approval to database', function() {
                        dhisCompletion = createMockCompletion();
                        dhisApproval = createMockApproval();

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
                            dataValues: [createMockDataValue({ lastUpdated: undefined, clientLastUpdated: someMomentInTime })],
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
                            dataValues: [createMockDataValue({ lastUpdated: undefined, clientLastUpdated: someMomentInTime })],
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

                    describe('merged data is different than existing approved data in Praxis', function() {
                        it('should invalidate the approvals in Praxis', function() {
                            var dhisDataValue = createMockDataValue({ value: 'newValue', lastUpdated: someMomentInTime }),
                                localDataValue = createMockDataValue({ value: 'oldValue', clientLastUpdated: someMomentInTime.subtract(1, 'hour') });

                            dhisDataValues = [dhisDataValue];
                            moduleDataBlock = createMockModuleDataBlock({
                                dataValues: [localDataValue],
                                approvedAtProjectLevel: true,
                                approvedAtCoordinationLevel: true
                            });

                            performMerge();

                            expect(approvalRepository.invalidateApproval).toHaveBeenCalledWith(moduleDataBlock.period, moduleDataBlock.moduleId);
                        });
                    });

                    describe('data exists in DHIS, no data exists in Praxis, but Praxis module was previously auto-approved', function() {
                        it('should invalidate the approvals in Praxis', function() {
                            dhisDataValues = [createMockDataValue()];
                            moduleDataBlock = createMockModuleDataBlock({
                                dataValues: [],
                                approvedAtProjectLevel: true,
                                approvedAtCoordinationLevel: true
                            });

                            performMerge();

                            expect(approvalRepository.invalidateApproval).toHaveBeenCalledWith(moduleDataBlock.period, moduleDataBlock.moduleId);
                        });
                    });

                    describe('merged data is the same as existing approved data in Praxis', function() {
                        it('should save merged data values but not invalidate completion or approval data in Praxis', function() {
                            var dhisDataValue = createMockDataValue({ lastUpdated: someMomentInTime }),
                                localDataValue = createMockDataValue({ clientLastUpdated: someMomentInTime.subtract(1, 'hour') });

                            dhisDataValues = [dhisDataValue];
                            moduleDataBlock = createMockModuleDataBlock({
                                dataValues: [localDataValue],
                                approvedAtProjectLevel: true,
                                approvedAtCoordinationLevel: true
                            });

                            performMerge();

                            expect(dataRepository.saveDhisData).toHaveBeenCalledWith([dhisDataValue]);
                            expect(approvalRepository.invalidateApproval).not.toHaveBeenCalled();
                        });
                    });

                    describe('data from DHIS has previously been downloaded and there are no updates in DHIS or Praxis', function () {
                        it('should save DHIS completion and approval data to database', function() {
                            dhisDataValues = undefined;
                            dhisCompletion = createMockCompletion();
                            dhisApproval = createMockApproval();
                            moduleDataBlock = createMockModuleDataBlock({
                                dataValues: [createMockDataValue()]
                            });

                            performMerge();

                            expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalled();
                        });
                    });

                    describe('approvals from DHIS have previously been downloaded', function() {
                        it('should not re-save DHIS completion and approval data to database', function() {
                            dhisDataValues = undefined;
                            dhisCompletion = createMockCompletion();
                            dhisApproval = createMockApproval();
                            moduleDataBlock = createMockModuleDataBlock({
                                dataValues: [createMockDataValue()],
                                approvalData: _.merge({ someLocalStatus: 'someStatus' }, dhisCompletion, dhisApproval)
                            });

                            performMerge();

                            expect(approvalRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
                        });
                    });
                });

                describe('approval functionality for linelist modules', function() {
                    it('should remove approvals from Praxis if it does not exist in DHIS', function() {
                        dhisCompletion = undefined;
                        dhisApproval = undefined;
                        moduleDataBlock = createMockModuleDataBlock({ lineListService: true });

                        performMerge();

                        expect(approvalRepository.invalidateApproval).toHaveBeenCalledWith(moduleDataBlock.period, moduleDataBlock.moduleId);
                    });

                    it('should save approvals to Praxis if they exist in DHIS', function() {
                        dhisCompletion = createMockCompletion();
                        dhisApproval = createMockApproval();
                        moduleDataBlock = createMockModuleDataBlock({ lineListService: true });

                        performMerge();

                        var expectedPayload = _.merge({}, dhisCompletion, dhisApproval);
                        expect(approvalRepository.saveApprovalsFromDhis).toHaveBeenCalledWith(expectedPayload);
                    });

                    it('should not save or remove approvals from Praxis if local approval is marked as new', function() {
                        moduleDataBlock = createMockModuleDataBlock({
                            lineListService: true,
                            approvalData: {
                                status: 'NEW'
                            }
                        });

                        performMerge();

                        expect(approvalRepository.invalidateApproval).not.toHaveBeenCalled();
                        expect(approvalRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
                    });

                    it('should not save or remove approvals from Praxis if local approval is marked as deleted', function() {
                        moduleDataBlock = createMockModuleDataBlock({
                            lineListService: true,
                            approvalData: {
                                status: 'DELETED'
                            }
                        });

                        performMerge();

                        expect(approvalRepository.invalidateApproval).not.toHaveBeenCalled();
                        expect(approvalRepository.saveApprovalsFromDhis).not.toHaveBeenCalled();
                    });
                });

                describe('module data block has previously failed to sync', function() {
                    describe('merged data is the same as existing data on DHIS but not Praxis', function() {
                        it('should delete the data sync failure', function() {
                            var dhisDataValue = createMockDataValue({ value: 'newValue', lastUpdated: someMomentInTime }),
                                localDataValue = createMockDataValue({ value: 'oldValue', clientLastUpdated: someMomentInTime.subtract(1, 'hour') });

                            dhisDataValues = [dhisDataValue];
                            moduleDataBlock = createMockModuleDataBlock({
                                dataValues: [localDataValue],
                                failedToSync: true
                            });

                            performMerge();

                            expect(dataSyncFailureRepository.delete).toHaveBeenCalledWith(moduleDataBlock.moduleId, moduleDataBlock.period);
                        });
                    });

                });
            });

            describe('uploadToDHIS', function() {
                var performUpload = function () {
                    moduleDataBlockMerger.uploadToDHIS(moduleDataBlock, dhisCompletion, dhisApproval);
                    scope.$apply();
                };

                describe('data values have been entered and approved only on Praxis', function () {
                    it('should upload data values to DHIS', function() {
                        var localDataValue = createMockDataValue();
                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesHaveBeenModifiedLocally: true,
                            dataValues: [localDataValue]
                        });

                        performUpload();
                        expect(dataService.save).toHaveBeenCalledWith([localDataValue]);
                    });

                    it('should remove locally-modified timestamps from local data', function() {
                        var localDataValue = createMockDataValue({ clientLastUpdated: someMomentInTime }),
                            dataValueWithoutLocalTimestamp = _.omit(localDataValue, 'clientLastUpdated');

                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesHaveBeenModifiedLocally: true,
                            dataValues: [localDataValue]
                        });

                        performUpload();
                        expect(dataRepository.saveDhisData).toHaveBeenCalledWith([dataValueWithoutLocalTimestamp]);
                    });

                    it('should upload completion data from Praxis to DHIS', function() {
                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesHaveBeenModifiedLocally: true,
                            approvedAtProjectLevel: true,
                            approvedAtProjectLevelBy: 'Kuala',
                            approvedAtProjectLevelAt: someMomentInTime
                        });

                        periodAndOrgUnit = { period: moduleDataBlock.period, orgUnit: moduleDataBlock.moduleId };

                        performUpload();
                        expect(approvalService.markAsComplete).toHaveBeenCalledWith(dataSetIds,
                            [periodAndOrgUnit],
                            moduleDataBlock.approvedAtProjectLevelBy,
                            moduleDataBlock.approvedAtProjectLevelAt.toISOString());
                    });

                    it('should upload approval data from Praxis to DHIS if data is approved at co-ordination level', function() {
                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesHaveBeenModifiedLocally: true,
                            approvedAtCoordinationLevel: true,
                            approvedAtCoordinationLevelBy: 'Kuala',
                            approvedAtCoordinationLevelAt: someMomentInTime
                        });

                        periodAndOrgUnit = { period: moduleDataBlock.period, orgUnit: moduleDataBlock.moduleId };

                        performUpload();
                        expect(approvalService.markAsApproved).toHaveBeenCalledWith(dataSetIds,
                            [periodAndOrgUnit],
                            moduleDataBlock.approvedAtCoordinationLevelBy,
                            moduleDataBlock.approvedAtCoordinationLevelAt.toISOString());
                    });
                });

                describe('data values in Praxis have not been modified locally', function() {
                    it('should not upload data values to DHIS', function() {
                        moduleDataBlock = createMockModuleDataBlock({ dataValuesHaveBeenModifiedLocally: false });

                        performUpload();
                        expect(dataService.save).not.toHaveBeenCalled();
                    });

                    it('should upload completion data to DHIS', function() {
                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesHaveBeenModifiedLocally: false,
                            approvedAtProjectLevel: true,
                            approvedAtProjectLevelBy: 'Kuala',
                            approvedAtProjectLevelAt: someMomentInTime
                        });

                        performUpload();
                        expect(approvalService.markAsComplete).toHaveBeenCalled();
                    });

                    it('should upload approval data to DHIS', function() {
                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesHaveBeenModifiedLocally: false,
                            approvedAtCoordinationLevel: true,
                            approvedAtCoordinationLevelBy: 'Kuala',
                            approvedAtCoordinationLevelAt: someMomentInTime
                        });

                        performUpload();
                        expect(approvalService.markAsApproved).toHaveBeenCalled();
                    });

                    it('should not re-upload completion and approval data to DHIS', function() {
                        dhisCompletion = createMockCompletion();
                        dhisApproval = createMockApproval();
                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesHaveBeenModifiedLocally: false,
                            approvedAtProjectLevel: true,
                            approvedAtProjectLevelBy: 'Kuala',
                            approvedAtProjectLevelAt: someMomentInTime,
                            approvedAtCoordinationLevel: true,
                            approvedAtCoordinationLevelBy: 'Kuala',
                            approvedAtCoordinationLevelAt: someMomentInTime
                        });

                        performUpload();
                        expect(approvalService.markAsUnapproved).not.toHaveBeenCalled();
                        expect(approvalService.markAsIncomplete).not.toHaveBeenCalled();
                        expect(approvalService.markAsComplete).not.toHaveBeenCalled();
                        expect(approvalService.markAsApproved).not.toHaveBeenCalled();
                    });

                    it('should delete then re-upload approval data in DHIS if completion data needs to be uploaded', function() {
                        dhisApproval = createMockApproval();

                        moduleDataBlock = createMockModuleDataBlock({
                            dataValuesHaveBeenModifiedLocally: false,
                            approvedAtProjectLevel: true,
                            approvedAtProjectLevelBy: 'Kuala',
                            approvedAtProjectLevelAt: someMomentInTime,
                            approvedAtCoordinationLevel: true,
                            approvedAtCoordinationLevelBy: 'Kuala',
                            approvedAtCoordinationLevelAt: someMomentInTime
                        });

                        performUpload();
                        expect(approvalService.markAsUnapproved).toHaveBeenCalled();
                        expect(approvalService.markAsIncomplete).not.toHaveBeenCalled();
                        expect(approvalService.markAsComplete).toHaveBeenCalled();
                        expect(approvalService.markAsApproved).toHaveBeenCalled();
                    });
                });

                describe('data values in Praxis have been modified locally', function() {
                    it('should delete approval data and completion data from DHIS if it is present and upload data values to DHIS', function() {
                        dhisCompletion = createMockCompletion();
                        dhisApproval = createMockApproval();

                        moduleDataBlock = createMockModuleDataBlock({ dataValuesHaveBeenModifiedLocally: true });

                        periodAndOrgUnit = { period: moduleDataBlock.period, orgUnit: moduleDataBlock.moduleId };

                        performUpload();
                        expect(approvalService.markAsUnapproved).toHaveBeenCalledWith(dataSetIds, [periodAndOrgUnit]);
                        expect(approvalService.markAsIncomplete).toHaveBeenCalledWith(dataSetIds, [periodAndOrgUnit]);
                        expect(dataService.save).toHaveBeenCalled();
                    });

                    it('should delete completion data from DHIS if it is present and upload data values to DHIS', function() {
                        dhisCompletion = createMockCompletion();

                        moduleDataBlock = createMockModuleDataBlock({ dataValuesHaveBeenModifiedLocally: true });

                        periodAndOrgUnit = { period: moduleDataBlock.period, orgUnit: moduleDataBlock.moduleId };

                        performUpload();

                        expect(approvalService.markAsUnapproved).not.toHaveBeenCalled();
                        expect(approvalService.markAsIncomplete).toHaveBeenCalledWith(dataSetIds, [periodAndOrgUnit]);
                        expect(dataService.save).toHaveBeenCalled();
                    });

                    it('should delete approval data from DHIS if it is present and upload data values to DHIS', function() {
                        dhisApproval = createMockApproval();

                        moduleDataBlock = createMockModuleDataBlock({ dataValuesHaveBeenModifiedLocally: true });

                        periodAndOrgUnit = {period: moduleDataBlock.period, orgUnit: moduleDataBlock.moduleId};

                        performUpload();
                        expect(approvalService.markAsIncomplete).not.toHaveBeenCalled();
                        expect(approvalService.markAsUnapproved).toHaveBeenCalledWith(dataSetIds, [periodAndOrgUnit]);
                        expect(dataService.save).toHaveBeenCalled();
                    });
                });
            });
        });
    });
