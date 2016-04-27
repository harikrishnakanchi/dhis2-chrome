define(['moduleDataBlock', 'customAttributes'], function(ModuleDataBlock, CustomAttributes) {
    describe('ModuleDataBlock', function () {
        var moduleDataBlock, orgUnit, period, aggregateDataValues, lineListDataValues, approvalData;

        beforeEach(function() {
            spyOn(CustomAttributes, 'parseAttribute');
        });

        describe('create()', function () {
            it('should return an instance with required properties', function () {
                orgUnit = {
                    id: 'orgUnitId'
                };
                period = '2016W06';
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListDataValues, approvalData);
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
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListDataValues, approvalData);
                expect(moduleDataBlock.moduleName).toEqual('parentName - orgUnitName');
            });

            it('should return just the orgUnit name if it has no parent', function () {
                orgUnit = {
                    name: 'orgUnitName'
                };
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListDataValues, approvalData);
                expect(moduleDataBlock.moduleName).toEqual('orgUnitName');
            });
        });

        describe('lineListService', function () {
            it('should parse the lineListService attribute', function () {
                orgUnit = {
                    attributeValues: 'someAttributeValue'
                };
                CustomAttributes.parseAttribute.and.returnValue('lineListServiceAttributeValue');

                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListDataValues, approvalData);

                expect(CustomAttributes.parseAttribute).toHaveBeenCalledWith(orgUnit.attributeValues, CustomAttributes.LINE_LIST_ATTRIBUTE_CODE);
                expect(moduleDataBlock.lineListService).toEqual('lineListServiceAttributeValue');
            });
        });

        describe('submitted for aggregate module', function() {
            beforeEach(function() {
                orgUnit = {
                    attributeValues: []
                };
            });

            it('should be true if there are dataValues and none of them are draft', function () {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    }]
                };
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListDataValues, approvalData);
                expect(moduleDataBlock.submitted).toEqual(true);
            });

            it('should be false if aggregateDataValues is not present', function () {
                aggregateDataValues = undefined;
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListDataValues, approvalData);
                expect(moduleDataBlock.submitted).toEqual(false);
            });

            it('should be false if aggregateDataValues has no dataValues collection', function () {
                aggregateDataValues = {};
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListDataValues, approvalData);
                expect(moduleDataBlock.submitted).toEqual(false);
            });

            it('should be false if aggregateDataValues has no empty dataValues collection', function () {
                aggregateDataValues = {
                    dataValues: []
                };
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListDataValues, approvalData);
                expect(moduleDataBlock.submitted).toEqual(false);
            });

            it('should be false if there are dataValues and some of them are draft', function () {
                aggregateDataValues = {
                    dataValues: [{
                        value: 'someValue'
                    },{
                        value: 'anotherValue',
                        isDraft: true
                    }]
                };
                moduleDataBlock = ModuleDataBlock.create(orgUnit, period, aggregateDataValues, lineListDataValues, approvalData);
                expect(moduleDataBlock.submitted).toEqual(false);
            });
        });
    });
});