define(['lodash'], function(_) {
    var ATTRIBUTE_CODES = {
        LINE_LIST_ATTRIBUTE_CODE: 'isLineListService',
        LINE_LIST_OFFLINE_SUMMARY_CODE: 'praxisLineListSummaryType',
        SHOW_IN_EVENT_SUMMARY_CODE: 'showInEventSummary',
        HOSPITAL_UNIT_CODE: 'hospitalUnitCode',
        OPERATION_UNIT_TYPE_CODE: 'opUnitType',
        DISABLED_CODE: 'isDisabled'
    };

    var getBooleanAttributeValue = function(attributeValues, attributeCode) {
        return getAttributeValue(attributeValues, attributeCode) == "true";
    };

    var getAttributeValue = function(attributeValues, attributeCode) {
        var correspondingAttributeValue = _.find(attributeValues, {
            attribute: {
                code: attributeCode
            }
        });

        return correspondingAttributeValue && correspondingAttributeValue.value;
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