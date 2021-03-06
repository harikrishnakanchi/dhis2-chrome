define(['lodash', 'customAttributes', 'moment', 'properties'], function (_, customAttributes, moment, properties) {
    var ModuleDataBlock = function (orgUnit, period, aggregateDataValues, lineListEvents, approvalData, failedToSyncData) {
        this.moduleId = orgUnit.id;
        this.period = period;
        this.moduleName = orgUnit.name;
        this.opUnitName = orgUnit.parent && orgUnit.parent.name;
        this.lineListService = customAttributes.getBooleanAttributeValue(orgUnit.attributeValues, customAttributes.LINE_LIST_ATTRIBUTE_CODE);
        this.active = isActive(this.period, orgUnit.openingDate);

        this.dataValues = getAggregateDataValues(aggregateDataValues);
        this.dataValuesHaveBeenModifiedLocally = dataValuesHaveBeenModifiedLocally(this.dataValues);
        this.events = lineListEvents || [];
        this.approvalData = approvalData || null;

        this.submitted = isSubmitted(this.dataValues, lineListEvents, this.lineListService);
        this.approvedAtProjectLevel = !!(approvalData && approvalData.isComplete);
        this.approvedAtProjectLevelBy = this.approvedAtProjectLevel ? approvalData.completedBy : null;
        this.approvedAtProjectLevelAt = this.approvedAtProjectLevel ? moment.utc(approvalData.completedOn) : null;
        this.approvedAtCoordinationLevel = !!(approvalData && approvalData.isApproved);
        this.approvedAtAnyLevel = this.approvedAtProjectLevel || this.approvedAtCoordinationLevel;

        this.failedToSync = isFailedToSync(this.lineListService, aggregateDataValues, failedToSyncData, this.approvedAtAnyLevel);

        this.awaitingActionAtDataEntryLevel = isWaitingForActionAtDataEntryLevel(this.submitted, this.approvedAtProjectLevel, this.approvedAtCoordinationLevel, this.failedToSync);
        this.awaitingActionAtProjectLevelApprover = isWaitingForActionAtProjectLevel(this.submitted, this.approvedAtProjectLevel, this.approvedAtCoordinationLevel, this.failedToSync);
        this.awaitingActionAtCoordinationLevelApprover = isWaitingForActionAtCoordinationLevel(this.submitted, this.approvedAtProjectLevel, this.approvedAtCoordinationLevel, this.failedToSync);
    };

    var isFailedToSync = function(lineListService, aggregateDataValues, failedToSyncData, approvedAtAnyLevel) {
        var failedToSync = !_.isEmpty(failedToSyncData);

        if(lineListService) {
            return failedToSync && approvedAtAnyLevel;
        } else
            return failedToSync;
    };

    var isWaitingForActionAtDataEntryLevel = function(submitted, approvedAtProject, approvedAtCoordination, failedToSync) {
        if(failedToSync) {
            return submitted && !approvedAtProject && !approvedAtCoordination;
        } else {
            return !submitted && !approvedAtProject && !approvedAtCoordination;
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
        openingDate = moment(openingDate);
        var dateToCompare = date12WeeksEarlier.isAfter(openingDate) ? date12WeeksEarlier : openingDate;
        return moment(period, "GGGG[W]W").startOf('isoweek') >= dateToCompare.startOf('isoweek');
    };

    var getAggregateDataValues = function(aggregateDataValues) {
        return _.compact(_.flatten(_.map(aggregateDataValues, 'dataValues')));
    };

    var isSubmitted = function (dataValues, lineListEvents, lineListService) {
        if(lineListService) {
            return !!(lineListEvents && lineListEvents.length > 0 && _.any(lineListEvents, eventIsSubmitted));
        } else {
            return !!(dataValues.length > 0 && !_.some(dataValues, { isDraft: true }));
        }
    };

    var eventIsSubmitted = function(event) {
        return _.isUndefined(event.localStatus) || event.localStatus == 'READY_FOR_DHIS';
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