define(['lodash', 'customAttributes', 'moment', 'properties'], function (_, CustomAttributes, moment, properties) {
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

        this.notSynced = !this.lineListService ? !!(aggregateDataValues && aggregateDataValues.localStatus && aggregateDataValues.localStatus == 'FAILED_TO_SYNC') : false;
        this.active = isActive(this.period, orgUnit.openingDate);
    };

    var isActive = function (period, openingDate) {
        var date12WeeksEarlier = moment().subtract(properties.weeksToDisplayStatusInDashboard, 'weeks');
        openingDate = moment(openingDate, 'YYYY-MM-DD');
        var dateToCompare = openingDate <= date12WeeksEarlier ? date12WeeksEarlier : openingDate;
        return moment(period, "GGGG[W]W").isoWeek() >= dateToCompare.isoWeek();
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