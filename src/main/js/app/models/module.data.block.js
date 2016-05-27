define(['lodash', 'customAttributes', 'moment', 'properties'], function (_, CustomAttributes, moment, properties) {
    var ModuleDataBlock = function (orgUnit, period, aggregateDataValues, lineListEvents, approvalData) {
        this.moduleId = orgUnit.id;
        this.period = period;
        this.moduleName = parseModuleName(orgUnit);
        this.lineListService = CustomAttributes.parseAttribute(orgUnit.attributeValues, CustomAttributes.LINE_LIST_ATTRIBUTE_CODE);

        this.dataValues = aggregateDataValues ? aggregateDataValues.dataValues : [];
        this.dataValuesLastUpdated = getMostRecentDataValueTimestamp(aggregateDataValues);
        this.dataValuesLastUpdatedOnDhis = getMostRecentDataValueTimestampFromDhis(aggregateDataValues);

        this.submitted = isSubmitted(aggregateDataValues, lineListEvents, this.lineListService);
        this.approvedAtProjectLevel = !!(approvalData && approvalData.isComplete);
        this.approvedAtProjectLevelBy = this.approvedAtProjectLevel ? approvalData.completedBy : null;
        this.approvedAtProjectLevelAt = this.approvedAtProjectLevel ? moment(approvalData.completedOn) : null;
        this.approvedAtCoordinationLevel = !!(approvalData && approvalData.isApproved);
        this.approvedAtCoordinationLevelBy = this.approvedAtCoordinationLevel ? approvalData.approvedBy : null;
        this.approvedAtCoordinationLevelAt = this.approvedAtCoordinationLevel ? moment(approvalData.approvedOn) : null;

        var dataValuesNotSynced = dataValuesFailedToSync(this.lineListService, aggregateDataValues);
        this.awaitingActionAtDataEntryLevel = !(this.submitted || this.approvedAtCoordinationLevel) || dataValuesNotSynced;
        this.awaitingActionAtProjectLevelApprover = (this.submitted && !this.approvedAtProjectLevel && !this.approvedAtCoordinationLevel)  && !dataValuesNotSynced;
        this.awaitingActionAtCoordinationLevelApprover = this.submitted && this.approvedAtProjectLevel && !this.approvedAtCoordinationLevel;

        this.notSynced = dataValuesNotSynced;
        this.active = isActive(this.period, orgUnit.openingDate);
    };

    var dataValuesFailedToSync = function (isLineListService, aggregateDataValues) {
        return isLineListService ? false : !!(aggregateDataValues && aggregateDataValues.localStatus && aggregateDataValues.localStatus == 'FAILED_TO_SYNC');
    };

    var isActive = function (period, openingDate) {
        var date12WeeksEarlier = moment().subtract(properties.weeksToDisplayStatusInDashboard, 'weeks');
        openingDate = moment(openingDate, 'YYYY-MM-DD');
        var dateToCompare = openingDate <= date12WeeksEarlier ? date12WeeksEarlier : openingDate;
        return moment(period, "GGGG[W]W").isoWeek() >= dateToCompare.isoWeek();
    };

    var isSubmitted = function (aggregateDataValues, lineListEvents, lineListService) {
        if(lineListService) {
            return !!(lineListEvents && lineListEvents.length > 0 && _.all(lineListEvents, eventIsSubmitted));
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

    var getMostRecentDataValueTimestamp = function(aggregateDataValues) {
        var getMostRecentTimestamp = function(dataValues) {
            var timestamps = _.flatten(_.map(dataValues, function(dataValue) {
                return [
                    moment(dataValue.lastUpdated || null),
                    moment(dataValue.clientLastUpdated || null)
                ];
            }));
            return moment.max(timestamps);
        };

        return (aggregateDataValues &&
            aggregateDataValues.dataValues &&
            aggregateDataValues.dataValues.length > 0 &&
            getMostRecentTimestamp(aggregateDataValues.dataValues)) || null;
    };

    var getMostRecentDataValueTimestampFromDhis = function(aggregateDataValues) {
        var getMostRecentDhisTimestamp = function(dataValues) {
            var rawTimestamps = _.compact(_.map(dataValues, 'lastUpdated')),
                momentTimestamps = _.map(rawTimestamps, function(timestamp) {
                    return moment(timestamp);
                });
            return momentTimestamps.length > 0 ? moment.max(momentTimestamps) : null;
        };

        return (aggregateDataValues &&
            aggregateDataValues.dataValues &&
            aggregateDataValues.dataValues.length > 0 &&
            getMostRecentDhisTimestamp(aggregateDataValues.dataValues)) || null;
    };

    ModuleDataBlock.create = function () {
        var moduleDataBlock = Object.create(ModuleDataBlock.prototype);
        ModuleDataBlock.apply(moduleDataBlock, arguments);
        return moduleDataBlock;
    };

    return ModuleDataBlock;
});