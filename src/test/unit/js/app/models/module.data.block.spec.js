define(['moduleDataBlock', 'customAttributes', 'moment', 'timecop'], function(ModuleDataBlock, CustomAttributes, moment, timecop) {
    describe('ModuleDataBlock', function () {
        var moduleDataBlock, orgUnit, period, aggregateDataValues, lineListEvents, approvalData;

        beforeEach(function() {
            spyOn(CustomAttributes, 'parseAttribute');
            aggregateDataValues = null;
            lineListEvents = null;
            approvalData = null;
        });

        var createModuleDataBlock = function() {
            return ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
        };
        describe('create()', function () {
            it('should return an instance with required properties', function () {
                orgUnit = {
                    id: 'orgUnitId'
                };
                period = '2016W06';
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.moduleId).toEqual(orgUnit.id);
                expect(moduleDataBlock.period).toEqual('2016W06');
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
                    CustomAttributes.parseAttribute.and.returnValue(false);
                });

                it('should be true if there are dataValues and none of them are draft', function () {
                    aggregateDataValues = {
                        dataValues: [{
                            value: 'someValue'
                        }]
                    };
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(true);
                });

                it('should be false if aggregateDataValues are not present', function () {
                    aggregateDataValues = undefined;
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if aggregateDataValues has no dataValues collection', function () {
                    aggregateDataValues = {};
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if aggregateDataValues has no empty dataValues collection', function () {
                    aggregateDataValues = {
                        dataValues: []
                    };
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if there are dataValues and some of them are draft', function () {
                    aggregateDataValues = {
                        dataValues: [{
                            value: 'someValue'
                        },{
                            value: 'anotherValue',
                            isDraft: true
                        }],
                        localStatus: "random status"
                    };
                    moduleDataBlock = createModuleDataBlock();
                    expect(moduleDataBlock.submitted).toEqual(false);
                });
            });

            describe('for a linelist module', function() {
                beforeEach(function() {
                    CustomAttributes.parseAttribute.and.returnValue(true);
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

        describe('awaitingActionAtDataEntryLevel', function() {
            beforeEach(function() {
                CustomAttributes.parseAttribute.and.returnValue(false);
            });

            it('should be true if data has not been submitted', function() {
                aggregateDataValues = null;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(true);
            });

            it('should be false if data has been submitted', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }]
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(false);
            });

            it('should be false if data has not been submitted but has been approved at coordination level by auto-approve job', function() {
                aggregateDataValues = null;
                approvalData = {
                    isApproved: true
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(false);
            });

            it('should be true if data has been submitted but not synced to DHIS', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }],
                    localStatus: "FAILED_TO_SYNC"
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toBeTruthy();
            });
        });

        describe('awaitingActionAtProjectLevelApprover', function() {
            beforeEach(function() {
                CustomAttributes.parseAttribute.and.returnValue(false);
            });

            it('should be true if data has been submitted', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }]
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toBeTruthy();
            });

            it('should be false if data is not submitted', function() {
                aggregateDataValues = null;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
            });

            it('should be false if data is submitted but approved at project level', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }]
                };
                approvalData = {
                    isComplete: true
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
            });

            it('should be false if data has been submitted, not approved at project level, but approved at coordination level by auto-approve job', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }]
                };
                approvalData = {
                    isComplete: false,
                    isApproved: true
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
            });

            it('should be false if data has been submitted, not synced to DHIS', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }],
                    localStatus: "FAILED_TO_SYNC"
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
            });
        });

        describe('awaitingActionAtCoordinationLevelApprover', function() {
            beforeEach(function() {
                CustomAttributes.parseAttribute.and.returnValue(false);
            });

            it('should be false if data has not been submitted ', function() {
                aggregateDataValues = null;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(false);
            });

            it('should be true if data has submitted and approved at project level', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }]
                };
                approvalData = {
                    isComplete: true
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(true);
            });

            it('should be false if data has been submitted but not approved at project level', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }]
                };
                approvalData = null;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(false);
            });

            it('should be false if data has been submitted and approved at project level and approved at coordination level', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }]
                };
                approvalData = {
                    isComplete: true,
                    isApproved: true
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(false);
            });
        });

        describe('notSynced', function() {
            beforeEach(function() {
                CustomAttributes.parseAttribute.and.returnValue(false);
            });

            it('should be false if it is lineListService', function() {
                CustomAttributes.parseAttribute.and.returnValue(true);
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.notSynced).toEqual(false);
            });

            it('should be false if localStatus is not "FAILED_TO_SYNC" ', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    },{
                        value: 'anotherValue',
                        isDraft: true
                    }],
                    localStatus: 'random status'
                };
                moduleDataBlock = createModuleDataBlock();

                expect(moduleDataBlock.notSynced).toEqual(false);
            });

            it('should be true if localStatus is "FAILED_TO_SYNC" ', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    },{
                        value: 'anotherValue',
                        isDraft: true
                    }],
                    localStatus: 'FAILED_TO_SYNC'
                };
                moduleDataBlock = createModuleDataBlock();

                expect(moduleDataBlock.notSynced).toEqual(true);
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

        describe('dataValuesLastUpdated', function() {
            it('should be null if aggregateDataValues are not present', function () {
                aggregateDataValues = undefined;
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValuesLastUpdated).toBeNull();
            });

            it('should be null if aggregateDataValues has no data values collection', function () {
                aggregateDataValues = {};
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValuesLastUpdated).toBeNull();
            });

            it('should be null if aggregateDataValues has no data values', function () {
                aggregateDataValues = {
                    dataValues: []
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValuesLastUpdated).toBeNull();
            });

            it('should return the most recent lastUpdated timestamp', function () {
                var someMomentInTime = moment('2016-05-18T00:00:00.000Z');
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue',
                        lastUpdated: someMomentInTime.toISOString()
                    }, {
                        value: 'someOtherValue',
                        lastUpdated: moment(someMomentInTime).subtract(1, 'hour').toISOString()
                    }]
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValuesLastUpdated).toEqual(someMomentInTime);
            });

            it('should return the most recent lastUpdated or clientLastUpdated timestamp', function () {
                var someMomentInTime = moment('2016-05-18T00:00:00.000Z');
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue',
                        clientLastUpdated: someMomentInTime.toISOString(),
                        lastUpdated: moment(someMomentInTime).subtract(1, 'hour').toISOString()
                    }, {
                        value: 'someOtherValue',
                        clientLastUpdated: someMomentInTime.toISOString()
                    }]
                };
                moduleDataBlock = createModuleDataBlock();
                expect(moduleDataBlock.dataValuesLastUpdated).toEqual(someMomentInTime);
            });
        });
    });
});