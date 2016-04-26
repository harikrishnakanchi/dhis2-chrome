define(['lodash'], function (_) {
    var LINE_LIST_ATTRIBUTE_CODE = 'isLineListService';

    var ModuleDataBlock = function (orgUnit, period, aggregateDataValues, lineListDataValues, approvalData) {
        this.moduleId = orgUnit.id;
        this.period = period;
        this.moduleName = parseModuleName(orgUnit);
        this.lineListService = parseLineListAttribute(orgUnit);
        this.submitted = isSubmitted(aggregateDataValues);
    };

    var isSubmitted = function (aggregateDataValues) {
        return !!(aggregateDataValues && aggregateDataValues.dataValues && aggregateDataValues.dataValues.length > 0 && !_.some(aggregateDataValues.dataValues, { isDraft: true }));
    };

    var parseLineListAttribute = function(module) {
        var lineListAttribute = _.find(module.attributeValues, {
            "attribute": {
                "code": LINE_LIST_ATTRIBUTE_CODE
            }
        });
        return !!(lineListAttribute && lineListAttribute.value == "true");
    };

    var parseModuleName = function (orgUnit) {
        if(orgUnit.parent) {
            return [orgUnit.parent.name, orgUnit.name].join(' - ');
        } else {
            return orgUnit.name;
        }
    };

    ModuleDataBlock.create = function (orgUnit, period, aggregateDataValues, lineListDataValues, approvalData) {
        return new ModuleDataBlock(orgUnit, period, aggregateDataValues, lineListDataValues, approvalData);
    };

    return ModuleDataBlock;
});