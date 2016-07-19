define(['lodash'], function(_) {
    var ATTRIBUTE_CODES = {
        LINE_LIST_ATTRIBUTE_CODE: 'isLineListService',
        LINE_LIST_OFFLINE_SUMMARY_CODE: 'praxisLineListSummaryType',
        SHOW_IN_EVENT_SUMMARY_CODE: 'showInEventSummary'
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

    return _.merge(ATTRIBUTE_CODES, {
        getBooleanAttributeValue: getBooleanAttributeValue,
        getAttributeValue: getAttributeValue
    });
});