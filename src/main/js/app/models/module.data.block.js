define(['lodash', 'customAttributes', 'moment', 'properties'], function (_, CustomAttributes, moment, properties) {
    var ModuleDataBlock = function (orgUnit, period, aggregateDataValues, lineListEvents, approvalData, failedToSyncData, eventsToSync) {
        this.moduleId = orgUnit.id;
        this.period = period;
        this.moduleName = parseModuleName(orgUnit);
        this.lineListService = CustomAttributes.parseAttribute(orgUnit.attributeValues, CustomAttributes.LINE_LIST_ATTRIBUTE_CODE);
        this.active = isActive(this.period, orgUnit.openingDate);

        this.dataValues = getAggregateDataValues(aggregateDataValues);
        this.dataValuesHaveBeenModifiedLocally = dataValuesHaveBeenModifiedLocally(this.dataValues);
        this.events = lineListEvents || [];
        this.approvalData = approvalData || null;
        this.eventsToSync = eventsToSync;

        this.submitted = isSubmitted(this.dataValues, lineListEvents, this.lineListService);
        this.approvedAtProjectLevel = !!(approvalData && approvalData.isComplete);
        this.approvedAtProjectLevelBy = this.approvedAtProjectLevel ? approvalData.completedBy : null;
        this.approvedAtProjectLevelAt = this.approvedAtProjectLevel ? moment(approvalData.completedOn) : null;
        this.approvedAtCoordinationLevel = !!(approvalData && approvalData.isApproved);
        this.approvedAtCoordinationLevelBy = this.approvedAtCoordinationLevel ? approvalData.approvedBy : null;
        this.approvedAtCoordinationLevelAt = this.approvedAtCoordinationLevel ? moment(approvalData.approvedOn) : null;
        this.approvedAtAnyLevel = this.approvedAtProjectLevel || this.approvedAtCoordinationLevel;
        this.shouldSyncEvents = this.eventsToSync && this.eventsToSync.length;

        this.failedToSync = isFailedToSync(this.lineListService, aggregateDataValues, failedToSyncData);

        this.awaitingActionAtDataEntryLevel = isWaitingForActionAtDataEntryLevel(this.submitted, this.approvedAtProjectLevel, this.approvedAtCoordinationLevel, this.failedToSync);
        this.awaitingActionAtProjectLevelApprover = isWaitingForActionAtProjectLevel(this.submitted, this.approvedAtProjectLevel, this.approvedAtCoordinationLevel, this.failedToSync);
        this.awaitingActionAtCoordinationLevelApprover = isWaitingForActionAtCoordinationLevel(this.submitted, this.approvedAtProjectLevel, this.approvedAtCoordinationLevel, this.failedToSync);
    };

    var isFailedToSync = function(lineListService, aggregateDataValues, failedToSyncData) {

        //This can be removed after v6.0 has been released
        var aggregateDataValuesFailedToSyncAsPerDeprecatedLocalStatus = !!aggregateDataValues && _.any(aggregateDataValues, { localStatus: 'FAILED_TO_SYNC' });
        var failedToSync = !_.isEmpty(failedToSyncData);

        return !lineListService && (failedToSync || aggregateDataValuesFailedToSyncAsPerDeprecatedLocalStatus);
    };

    var isWaitingForActionAtDataEntryLevel = function(submitted, approvedAtProject, approvedAtCoordination, failedToSync) {
        if(failedToSync) {
            return submitted && !approvedAtProject && !approvedAtCoordination;
        } else {
            return !submitted && !approvedAtCoordination;
        }
    };

    var isWaitingForActionAtProjectLevel = function(submitted, approvedAtProject, approvedAtCoordination, failedToSync) {
        if(failedToSync) {
            return approvedAtProject &&!approvedAtCoordination;
        } else {
            return submitted && !approvedAtProject && !approvedAtCoordination;
        }
    };

    var isWaitingForActionAtCoordinationLevel = function(submitted, approvedAtProject, approvedAtCoordination, failedToSync) {
        if(failedToSync) {
            return approvedAtCoordination;
        } else {
            return submitted && approvedAtProject && !approvedAtCoordination;
        }
    };

    var isActive = function (period, openingDate) {
        var date12WeeksEarlier = moment().subtract(properties.weeksToDisplayStatusInDashboard, 'weeks');
        openingDate = moment(openingDate, 'YYYY-MM-DD');
        var dateToCompare = openingDate <= date12WeeksEarlier ? date12WeeksEarlier : openingDate;
        return moment(period, "GGGG[W]W").isoWeek() >= dateToCompare.isoWeek();
    };

    var getAggregateDataValues = function(aggregateDataValues) {
        return _.compact(_.flatten(_.map(aggregateDataValues, 'dataValues')));
    };

    var isSubmitted = function (dataValues, lineListEvents, lineListService) {
        if(lineListService) {
            return !!(lineListEvents && lineListEvents.length > 0 && _.all(lineListEvents, eventIsSubmitted));
        } else {
            return !!(dataValues.length > 0 && !_.some(dataValues, { isDraft: true }));
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

    var dataValuesHaveBeenModifiedLocally = function(aggregateDataValues) {
        return _.any(aggregateDataValues, function(dataValue) {
            return !!dataValue.clientLastUpdated;
        });
    };

    ModuleDataBlock.create = function () {
        var moduleDataBlock = Object.create(ModuleDataBlock.prototype);
        ModuleDataBlock.apply(moduleDataBlock, arguments);
        return moduleDataBlock;
    };

    return ModuleDataBlock;
});