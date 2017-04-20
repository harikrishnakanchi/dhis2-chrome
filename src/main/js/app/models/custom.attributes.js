define(['lodash', 'moment'], function(_, moment) {
    var codeIdMapper;
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
        SERVICE_CODE: 'praxisServiceCode',
        EXCLUDE_FROM_TOTAL: 'praxisExcludeFromTotal',
        TYPE: 'Type',
        PROJECT_CODE: 'projCode',
        AUTO_APPROVE: 'autoApprove',
        EVENT_DATE: 'useAsEventDate',
        ASSOCIATED_DATA_SET_CODE: 'associatedDataSet',
        PEDIATRIC_AGE_FIELD_CODE: 'pediatricAgeField',
        EST_POPULATION_OF_WOMEN_OF_CHILD_BEARING_AGE_CODE: 'estPopulationOfWomenOfChildBearingAge',
        EST_POPULATION_BETWEEN_1_AND_5_YEARS_CODE: 'estPopulationBetween1And5Years',
        EST_POPULATION_LESS_THAN_1_YEAR_CODE: 'estPopulationLessThan1Year',
        ESTIMATED_TARGET_POPULATION_CODE: 'estimatedTargetPopulation',
        PROJECT_END_DATE_CODE: 'prjEndDate',
        PROJECT_CONTEXT_CODE: 'prjCon',
        PROJECT_LOCATION_CODE: 'prjLoc',
        PROJECT_POPULATION_TYPE_CODE: 'prjPopType',
        REASON_FOR_INTERVENTION_CODE: 'reasonForIntervention',
        MODE_OF_OPERATION_CODE: 'modeOfOperation',
        MODEL_OF_MANAGEMENT_CODE: 'modelOfManagement',
        PROJECT_TYPE_CODE: 'projectType',
        ORG_UNIT_GROUP_SET_LEVEL: 'groupSetLevel'
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
        return _.filter(attributeValues, function (attributeValue) {
            return attributeValue && !_.isEmpty(attributeValue.value);
        });
    };

    var createAttribute = function (attributeCode, value) {
        return {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": attributeCode,
                "id": codeIdMapper[attributeCode]
            },
            "value": value
        };
    };

    var initializeData = function (attributes) {
        codeIdMapper = _.reduce(attributes, function (result, attribute) {
            result[attribute.code] = attribute.id;
            return result;
        }, {});
    };

    return _.merge(ATTRIBUTE_CODES, {
        getBooleanAttributeValue: getBooleanAttributeValue,
        getAttributeValue: getAttributeValue,
        cleanAttributeValues: cleanAttributeValues,
        createAttribute: createAttribute,
        initializeData: initializeData
    });
});