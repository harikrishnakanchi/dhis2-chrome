define(['lodash'], function(_) {
    var ATTRIBUTE_CODES = {
        LINE_LIST_ATTRIBUTE_CODE: 'isLineListService',
        LINE_LIST_OFFLINE_SUMMARY_CODE: 'praxisLineListSummaryType',
        SHOW_IN_EVENT_SUMMARY_CODE: 'showInEventSummary',
        HOSPITAL_UNIT_CODE: 'hospitalUnitCode',
        OPERATION_UNIT_TYPE_CODE: 'opUnitType',
        DISABLED_CODE: 'isDisabled',
        PRAXIS_SHOW_IN_MODULE_CREATION_CODE: 'praxisShowInModuleCreation',
        ORIGIN_DATA_SET_CODE: 'isOriginDataset',
        REFERRAL_DATA_SET_CODE: 'isReferralDataset',
        POPULATION_DATA_SET_CODE: 'isPopulationDataset',
        NEW_DATA_MODEL_CODE: 'isNewDataModel',
        MANDATORY_CODE: 'mandatory',
        HIDE_AGGREGATE_DATA_SET_SECTION_TOTALS: 'hideAggregateDataSetSectionTotals',
        PRAXIS_POPULATION_DATA_ELEMENTS: 'praxisPopulationDataElements',
        ASSOCIATED_PROGRAM_CODE: 'associatedProgram', // TODO REMOVE AFTER 10.0
        SERVICE_CODE: 'praxisServiceCode',
        EXCLUDE_FROM_TOTAL: 'praxisExcludeFromTotal'
    };

    var getBooleanAttributeValue = function(attributeValues, attributeCode) {
        return getAttributeValue(attributeValues, attributeCode) == "true";
    };

    var getAttributeValue = function(attributeValues, attributeCode, defaultValue) {
        var correspondingAttributeValue = _.find(attributeValues, {
            attribute: {
                code: attributeCode
            }
        });

        return correspondingAttributeValue ? correspondingAttributeValue.value : defaultValue;
    };

    var cleanAttributeValues = function (attributeValues) {
        return _.filter(attributeValues, 'value');
    };

    return _.merge(ATTRIBUTE_CODES, {
        getBooleanAttributeValue: getBooleanAttributeValue,
        getAttributeValue: getAttributeValue,
        cleanAttributeValues: cleanAttributeValues
    });
});