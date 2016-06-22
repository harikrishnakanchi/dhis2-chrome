define(['moduleDataBlock', 'customAttributes', 'moment', 'timecop'], function(ModuleDataBlock, CustomAttributes, moment, timecop) {
    describe('ModuleDataBlock', function () {
        var moduleDataBlock, orgUnit, period, aggregateDataValues, lineListEvents, approvalData, someMomentInTime, isLineListService, failedToSyncData, eventsToSync;

        beforeEach(function() {
            isLineListService = false;
            spyOn(CustomAttributes, 'parseAttribute').and.callFake(function() {
                return isLineListService;
            });
            orgUnit = {
                id: 'someOrgUnitId'
            };
            period = 'somePeriod';
            aggregateDataValues = undefined;
            lineListEvents = undefined;
            approvalData = undefined;
            eventsToSync = undefined;
            failedToSyncData = {};
            someMomentInTime = moment('2016-05-18T00:00:00.000Z');
        });

        var createModuleDataBlock = function() {
            return ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData, failedToSyncData, eventsToSync);
        };

        var createMockDataValue = function(options) {
            return _.merge({
                dataElement: 'someDataElementId',
                period: 'somePeriod',
                orgUnit: 'someOrgUnit',
                categoryOptionCombo: 'someCategoryOptionComboId',
                lastUpdated: '2016-05-04T09:00:00.000Z',
                value: 'someValue'
            }, options);
        };

        var createMockDataValuesObject = function(options) {
            return _.merge({
                dataValues: [createMockDataValue()]
            }, options);
        };

        describe('create()', function () {
            it('should return an instance with required properties', function () {
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.moduleId).toEqual(orgUnit.id);
                expect(moduleDataBlock.period).toEqual(period);
            });
        });

        describe('moduleName', function () {
            it('should concatenate the orgUnit parent name and orgUnit name', function () {
                orgUnit = {
                    name: 'orgUnitName',
                    parent: {
                        name: 'parentName'
                    }
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.moduleName).toEqual('parentName - orgUnitName');
            });

            it('should return just the orgUnit name if it has no parent', function () {
                orgUnit = {
                    name: 'orgUnitName'
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.moduleName).toEqual('orgUnitName');
            });
        });

        describe('lineListService', function () {
            it('should parse the lineListService attribute', function () {
                orgUnit = {
                    attributeValues: 'someAttributeValue'
                };
                CustomAttributes.parseAttribute.and.returnValue('lineListServiceAttributeValue');

                moduleDataBlock = createModuleDataBlock();

                expect(CustomAttributes.parseAttribute).toHaveBeenCalledWith(orgUnit.attributeValues, CustomAttributes.LINE_LIST_ATTRIBUTE_CODE);
                expect(moduleDataBlock.lineListService).toEqual('lineListServiceAttributeValue');
            });
        });

        describe('submitted', function() {
            describe('for an aggregate module', function() {
                beforeEach(function() {
                    isLineListService = false;
                });

                it('should be true if there are dataValues and none of them are draft', function () {
                    aggregateDataValues = [createMockDataValuesObject()];
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(true);
                });

                it('should be false if aggregateDataValues are not present', function () {
                    aggregateDataValues = undefined;
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if all of the aggregateDataValues have no dataValues collection', function () {
                    aggregateDataValues = [{}];
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if aggregateDataValues has empty dataValues collection', function () {
                    aggregateDataValues = [{ dataValues: [] }];
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if there are dataValues and some of them are draft', function () {
                    aggregateDataValues = [createMockDataValuesObject({
                        dataValues: [
                            createMockDataValue(),
                            createMockDataValue({ isDraft: true })
                        ]
                    })];
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(false);
                });
            });

            describe('for a linelist module', function() {
                beforeEach(function() {
                    isLineListService = true;
                });

                it('should be true if none of the events have a localStatus', function () {
                    lineListEvents = [{
                        someEventInfo: 'someEventDetails'
                    }];
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(true);
                });

                it('should be false if lineListEvents are not present', function() {
                    lineListEvents = undefined;
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if lineListEvents is an empty array', function() {
                    lineListEvents = [];
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if there are events with a localStatus not equal to READY_FOR_DHIS', function () {
                    lineListEvents = [{
                        someEventInfo: 'someEventDetails',
                        localStatus: 'SOME_OTHER_STATUS'
                    }];
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(false);
                });
            });
        });

        describe('dataValues', function() {
            it('should return empty array if aggregateDataValues are undefined', function() {
                aggregateDataValues = undefined;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValues).toEqual([]);
            });

            it('should return empty array if aggregateDataValues has no data values collection', function() {
                aggregateDataValues = [{}];
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValues).toEqual([]);
            });

            it('should return aggregateDataValues', function() {
                var dataValues = [createMockDataValue()];
                aggregateDataValues = [createMockDataValuesObject({
                    dataValues: dataValues
                })];
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValues).toEqual(dataValues);
            });
        });

        describe('approvalData', function() {
            it('should return null if approvalData is undefined', function() {
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvalData).toBeNull();
            });

            it('should return approvalData', function() {
                approvalData = { someApproval: 'data' };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvalData).toEqual(approvalData);
            });
        });

        describe('approvedAtProjectLevel', function() {
            it('should be true if approvalData has completed status as true', function() {
                approvalData = {
                    isComplete: true
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtProjectLevel).toEqual(true);
            });

            it('should be false if approvalData has completed status as false', function() {
                approvalData = {
                    isComplete: false
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtProjectLevel).toEqual(false);
            });

            it('should be false if approvalData is not present', function() {
                approvalData = undefined;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtProjectLevel).toEqual(false);
            });

            it('should be false if approvalData has no completed status', function() {
                approvalData = {};
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtProjectLevel).toEqual(false);
            });
        });

        describe('approvedAtProjectLevelBy', function() {
            it('should be null if there is no completion data', function() {
                approvalData = undefined;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtProjectLevelBy).toBeNull();
            });

            it('should return completedBy if there is completion data', function() {
                approvalData = { completedBy: 'Kuala', isComplete: true };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtProjectLevelBy).toEqual('Kuala');
            });

            it('should return null if completed status is false', function() {
                approvalData = { completedBy: 'Kuala', isComplete: false };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtProjectLevelBy).toBeNull();
            });
        });

        describe('approvedAtProjectLevelAt', function() {
            it('should be null if there is no completion data', function() {
                approvalData = undefined;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtProjectLevelAt).toBeNull();
            });

            it('should return completedOn if there is completion data', function() {
                approvalData = { completedOn: someMomentInTime.toISOString(), isComplete: true };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtProjectLevelAt).toEqual(someMomentInTime);
            });

            it('should return null if completed status is false', function() {
                approvalData = { completedOn: someMomentInTime.toISOString(), isComplete: false };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtProjectLevelAt).toBeNull();
            });
        });

        describe('approvedAtCoordinationLevel', function() {
            it('should be true if approvalData has approved status as true', function() {
                approvalData = {
                    isApproved: true
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtCoordinationLevel).toEqual(true);
            });

            it('should be false if approvalData has approved status as false', function() {
                approvalData = {
                    isApproved: false
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtCoordinationLevel).toEqual(false);
            });

            it('should be false if approvalData is not present', function() {
               approvalData = undefined;
               moduleDataBlock = createModuleDataBlock();
               expect(moduleDataBlock.approvedAtCoordinationLevel).toEqual(false);
            });

            it('should be false if approvalData has no approval status', function() {
                approvalData = {};
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtCoordinationLevel).toEqual(false);
            });
        });

        describe('approvedAtCoordinationLevelBy', function() {
            it('should be null if there is no approval data', function() {
                approvalData = undefined;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtCoordinationLevelBy).toBeNull();
            });


            it('should return completedBy if there is approval data', function() {
                approvalData = { approvedBy: 'Kuala', isApproved: true };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtCoordinationLevelBy).toEqual('Kuala');
            });

            it('should return null if approval status is false', function() {
                approvalData = { approvedBy: 'Kuala', isApproved: false };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtCoordinationLevelBy).toBeNull();
            });
        });

        describe('approvedAtCoordinationLevelAt', function() {
            it('should be null if there is no approval data', function() {
                approvalData = undefined;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtCoordinationLevelAt).toBeNull();
            });

            it('should return approvedOn if there is approval data', function() {
                approvalData = { approvedOn: someMomentInTime.toISOString(), isApproved: true };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtCoordinationLevelAt).toEqual(someMomentInTime);
            });

            it('should return null if completed status is false', function() {
                approvalData = { approvedOn: someMomentInTime.toISOString(), isApproved: false };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.approvedAtCoordinationLevelAt).toBeNull();
            });
        });

        describe('awaitingActionAt DataEntryLevel, ProjectLevelApprover, CoordinationLevelApprover', function() {
            it('should be waiting at dataEntryLevel if data has not been submitted', function() {
                aggregateDataValues = null;

                moduleDataBlock = createModuleDataBlock();

                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(true);
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(false);
            });

            it('should be waiting at projectLevel if data has been submitted', function() {
                aggregateDataValues = [createMockDataValuesObject()];

                moduleDataBlock = createModuleDataBlock();

                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(true);
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(false);
            });

            it('should be waiting at coordinationLevel if data has been submitted and approved at project level', function() {
                aggregateDataValues = [createMockDataValuesObject()];
                approvalData = {
                    isComplete: true
                };

                moduleDataBlock = createModuleDataBlock();

                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(true);
            });

            it('should not be waiting at any level if data has been submitted and approved at project and coordination level', function() {
                aggregateDataValues = [createMockDataValuesObject()];
                approvalData = {
                    isComplete: true,
                    isApproved: true
                };
                moduleDataBlock = createModuleDataBlock();

                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(false);
            });

            it('should not be waiting at any level if data has not been submitted but has been approved at coordination level by auto-approve job', function() {
                aggregateDataValues = null;
                approvalData = {
                    isApproved: true
                };

                moduleDataBlock = createModuleDataBlock();

                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(false);
            });

            it('should not be waiting at any level if data has been submitted, not approved at project level, but approved at coordination level by auto-approve job', function() {
                aggregateDataValues = [createMockDataValuesObject()];
                approvalData = {
                    isApproved: true
                };

                moduleDataBlock = createModuleDataBlock();

                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(false);
            });

            it('should be waiting at dataEntryLevel if data has been submitted but failed to sync', function() {
                aggregateDataValues = [createMockDataValuesObject()];

                failedToSyncData = {"moduleId": "someModuleId", "period": "somePeriod"};
                moduleDataBlock = createModuleDataBlock();

                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(true);
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(false);
            });

            it('should be waiting at projectLevel if data has been submitted, approved at project level, but failed to sync', function() {
                aggregateDataValues = [createMockDataValuesObject()];
                failedToSyncData = {"moduleId": "someModuleId", "period": "period"};
                approvalData = {
                    isComplete: true,
                };

                moduleDataBlock = createModuleDataBlock();

                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(true);
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(false);
            });

            it('should be waiting at coordinationLevel if data has been submitted, approved at project and coordination level, but failed to sync', function() {
                aggregateDataValues = [createMockDataValuesObject()];
                failedToSyncData = {"moduleId": "someModuleId", "period": "period"};
                approvalData = {
                    isComplete: true,
                    isApproved: true,
                };

                moduleDataBlock = createModuleDataBlock();

                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(true);
            });
        });

        describe('failedToSync', function() {
            beforeEach(function() {
                isLineListService = false;
            });
 //These can be removed after v6.0 has been released
            describe('compatibility with deprecated localStatus flags', function() {
                it('should be true if localStatus is FAILED_TO_SYNC', function() {
                    aggregateDataValues = [createMockDataValuesObject({
                        localStatus: "FAILED_TO_SYNC"
                    })];
                    moduleDataBlock = createModuleDataBlock();

                    expect(moduleDataBlock.failedToSync).toEqual(true);
                });

                it('should be false if localStatus is not FAILED_TO_SYNC', function() {
                    aggregateDataValues = [createMockDataValuesObject({
                        localStatus: "SOME_OTHER_STATUS"
                    })];
                    moduleDataBlock = createModuleDataBlock();

                    expect(moduleDataBlock.failedToSync).toEqual(false);
                });
            });
        });

        describe('active', function() {
            beforeEach(function () {
                Timecop.install();
                Timecop.freeze(new Date("2016-05-04T10:46:29.382Z"));
            });

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it('should be true if period is after opening date or date12WeeksEarlier which ever is most recent', function() {
                orgUnit = {
                    openingDate: '2016-02-25'
                };
                period = '2016W8';
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.active).toEqual(true);
            });

            it('should be false if period is before opening date or date12WeeksEarlier which ever is most recent', function() {
                orgUnit = {
                    openingDate: '2016-02-01'
                };
                period = '2016W3';
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.active).toEqual(false);
            });
        });

        describe('dataValuesHaveBeenModifiedLocally', function() {
            it('should return false if aggregateDataValues are not present', function () {
                aggregateDataValues = undefined;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValuesHaveBeenModifiedLocally).toEqual(false);
            });

            it('should return false if aggregateDataValues has no data values collection', function () {
                aggregateDataValues = [{}];
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValuesHaveBeenModifiedLocally).toEqual(false);
            });

            it('should return false if aggregateDataValues has no data values', function () {
                aggregateDataValues = [{ dataValues: [] }];
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValuesHaveBeenModifiedLocally).toEqual(false);
            });

            it('should return true if there are locally created or updated data values', function () {
                aggregateDataValues = [createMockDataValuesObject({
                    dataValues: [
                        createMockDataValue(),
                        createMockDataValue({ clientLastUpdated: someMomentInTime.toISOString() })
                    ]
                })];
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValuesHaveBeenModifiedLocally).toEqual(true);
            });

            it('should return false if there are only data values downloaded from DHIS', function () {
                aggregateDataValues = [createMockDataValuesObject()];
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValuesHaveBeenModifiedLocally).toEqual(false);
            });
        });

        describe('shouldSyncEvents', function () {
            it('should return true if there are events', function () {
                eventsToSync = [{
                        event: 'event1',
                        'eventDate': 'someDate'
                    },{
                        event: 'event2',
                        'eventDate': 'someOtherDate'
                    }];
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.shouldSyncEvents).toBeTruthy();
            });
            it('should return false if there are no events', function(){
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.shouldSyncEvents).toBeFalsy();
            });
        });
    });
});