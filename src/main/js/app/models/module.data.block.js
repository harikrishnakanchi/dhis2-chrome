define(['lodash', 'customAttributes', 'moment'], function (_, CustomAttributes, moment) {
    var ModuleDataBlock = function (orgUnit, period, aggregateDataValues, lineListEvents, approvalData) {
        this.moduleId = orgUnit.id;
        this.period = period;
        this.moduleName = parseModuleName(orgUnit);
        this.lineListService = CustomAttributes.parseAttribute(orgUnit.attributeValues, CustomAttributes.LINE_LIST_ATTRIBUTE_CODE);

        this.submitted = isSubmitted(aggregateDataValues, lineListEvents, this.lineListService);
        this.approvedAtProjectLevel = !!(approvalData && approvalData.isComplete);
        this.approvedAtCoordinationLevel = !!(approvalData && approvalData.isApproved);

        this.awaitingActionAtDataEntryLevel = !this.submitted && !this.approvedAtCoordinationLevel;
        this.awaitingActionAtProjectLevelApprover = this.submitted && !this.approvedAtProjectLevel && !this.approvedAtCoordinationLevel;
        this.awaitingActionAtCoordinationLevelApprover = this.submitted && this.approvedAtProjectLevel && !this.approvedAtCoordinationLevel;

        this.active = moment(this.period, "GGGG[W]W").isoWeek() >= moment(orgUnit.openingDate).isoWeek();
        this.notSynced = !this.lineListService ? !!(aggregateDataValues && aggregateDataValues.localStatus && aggregateDataValues.localStatus == 'FAILED_TO_SYNC') : false;
    };

    var isSubmitted = function (aggregateDataValues, lineListEvents, lineListService) {
        if(lineListService) {
            return !!(lineListEvents && lineListEvents.length > 0 &&_.all(lineListEvents, eventIsSubmitted));
        } else {
            return !!(aggregateDataValues && aggregateDataValues.dataValues && aggregateDataValues.dataValues.length > 0 && !_.some(aggregateDataValues.dataValues, { isDraft: true }));
        }
    };

    var eventIsSubmitted = function(event) {
        return _.isUndefined(event.localStatus) || event.localStatus == 'READY_FOR_DHIS';
    };
    var parseModuleName = function (orgUnit) {
        if(orgUnit.parent) {
            return [orgUnit.parent.name, orgUnit.name].join(' - ');
        } else {
            return orgUnit.name;
        }
    };

    ModuleDataBlock.create = function () {
        var moduleDataBlock = Object.create(ModuleDataBlock.prototype);
        ModuleDataBlock.apply(moduleDataBlock, arguments);
        return moduleDataBlock;
    };

    return ModuleDataBlock;
});