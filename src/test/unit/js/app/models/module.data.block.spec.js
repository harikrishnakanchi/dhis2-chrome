define(['moduleDataBlock', 'customAttributes'], function(ModuleDataBlock, CustomAttributes) {
    describe('ModuleDataBlock', function () {
        var moduleDataBlock, orgUnit, period, aggregateDataValues, lineListEvents, approvalData;

        beforeEach(function() {
            spyOn(CustomAttributes, 'parseAttribute');
            aggregateDataValues = null;
            lineListEvents = null;
            approvalData = null;
        });

        describe('create()', function () {
            it('should return an instance with required properties', function () {
                orgUnit = {
                    id: 'orgUnitId'
                };
                period = '2016W06';
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
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
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.moduleName).toEqual('parentName - orgUnitName');
            });

            it('should return just the orgUnit name if it has no parent', function () {
                orgUnit = {
                    name: 'orgUnitName'
                };
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.moduleName).toEqual('orgUnitName');
            });
        });

        describe('lineListService', function () {
            it('should parse the lineListService attribute', function () {
                orgUnit = {
                    attributeValues: 'someAttributeValue'
                };
                CustomAttributes.parseAttribute.and.returnValue('lineListServiceAttributeValue');

                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);

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
                    moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                    expect(moduleDataBlock.submitted).toEqual(true);
                });

                it('should be false if aggregateDataValues are not present', function () {
                    aggregateDataValues = undefined;
                    moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if aggregateDataValues has no dataValues collection', function () {
                    aggregateDataValues = {};
                    moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if aggregateDataValues has no empty dataValues collection', function () {
                    aggregateDataValues = {
                        dataValues: []
                    };
                    moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
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
                    moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
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
                    moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                    expect(moduleDataBlock.submitted).toEqual(true);
                });

                it('should be false if lineListEvents are not present', function() {
                    lineListEvents = undefined;
                    moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if lineListEvents is an empty array', function() {
                    lineListEvents = [];
                    moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                    expect(moduleDataBlock.submitted).toEqual(false);
                });

                it('should be false if there are events with a localStatus not equal to READY_FOR_DHIS', function () {
                    lineListEvents = [{
                        someEventInfo: 'someEventDetails',
                        localStatus: 'SOME_OTHER_STATUS'
                    }];
                    moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                    expect(moduleDataBlock.submitted).toEqual(false);
                });
            });
        });

        describe('approvedAtProjectLevel', function() {
            it('should be true if approvalData has completed status as true', function() {
                approvalData = {
                    isComplete: true
                };
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.approvedAtProjectLevel).toEqual(true);
            });

            it('should be false if approvalData has completed status as false', function() {
                approvalData = {
                    isComplete: false
                };
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.approvedAtProjectLevel).toEqual(false);
            });

            it('should be false if approvalData is not present', function() {
                approvalData = undefined;
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.approvedAtProjectLevel).toEqual(false);
            });

            it('should be false if approvalData has no completed status', function() {
                approvalData = {};
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.approvedAtProjectLevel).toEqual(false);
            });
        });

        describe('approvedAtCoordinationLevel', function() {
            it('should be true if approvalData has approved status as true', function() {
                approvalData = {
                    isApproved: true
                };
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.approvedAtCoordinationLevel).toEqual(true);
            });

            it('should be false if approvalData has approved status as false', function() {
                approvalData = {
                    isApproved: false
                };
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.approvedAtCoordinationLevel).toEqual(false);
            });

            it('should be false if approvalData is not present', function() {
               approvalData = undefined;
               moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
               expect(moduleDataBlock.approvedAtCoordinationLevel).toEqual(false);
            });

            it('should be false if approvalData has no approval status', function() {
                approvalData = {};
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.approvedAtCoordinationLevel).toEqual(false);
            });
        });

        describe('awaitingActionAtDataEntryLevel', function() {
            beforeEach(function() {
                CustomAttributes.parseAttribute.and.returnValue(false);
            });

            it('should be true if data has not been submitted', function() {
                aggregateDataValues = null;
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(true);
            });

            it('should be false if data has been submitted', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }]
                };
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(false);
            });

            it('should be false if data has not been submitted but has been approved at coordination level by auto-approve job', function() {
                aggregateDataValues = null;
                approvalData = {
                    isApproved: true
                };
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.awaitingActionAtDataEntryLevel).toEqual(false);
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
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toBeTruthy();
            });

            it('should be false if data is not submitted', function() {
                aggregateDataValues = null;
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
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
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
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
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.awaitingActionAtProjectLevelApprover).toEqual(false);
            });
        });

        describe('awaitingActionAtCoordinationLevelApprover', function() {
            beforeEach(function() {
                CustomAttributes.parseAttribute.and.returnValue(false);
            });

            it('should be false if data has not been submitted ', function() {
                aggregateDataValues = null;
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
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
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(true);
            });

            it('should be false if data has been submitted but not approved at project level', function() {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }]
                };
                approvalData = null;
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
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
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.awaitingActionAtCoordinationLevelApprover).toEqual(false);
            });
        });

        describe('notSynced', function() {
            beforeEach(function() {
                CustomAttributes.parseAttribute.and.returnValue(false);
            });

            it('should be false if it is lineListService', function() {
                CustomAttributes.parseAttribute.and.returnValue(true);
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
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
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);

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
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);

                expect(moduleDataBlock.notSynced).toEqual(true);
            });
        });

        describe('active', function() {
            it('should be true if period is after opening date', function() {
                orgUnit = {
                    id: 'orgUnitId',
                    openingDate: '2016-03-19'
                };
                period = '2016W18';
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.active).toEqual(true);
            });

            it('should be false if period is before opening date', function() {
                orgUnit = {
                    id: 'orgUnitId',
                    openingDate: '2016-04-03'
                };
                period = '2016W12';
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.active).toEqual(false);
            });

            it('should be true if opening date is within the same week as period', function() {
                orgUnit = {
                    id: 'orgUnitId',
                    openingDate: '2016-03-12'
                };
                period = '2016W10';
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListEvents, approvalData);
                expect(moduleDataBlock.active).toEqual(true);
            });
        });
    });
});