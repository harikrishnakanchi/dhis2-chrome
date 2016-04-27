define(['lodash'], function(_) {
    var ATTRIBUTE_CODES = {
        LINE_LIST_ATTRIBUTE_CODE: 'isLineListService'
    };

    var parseAttribute = function(attributeValues, attributeCode) {
        var correspondingAttributeValue = _.find(attributeValues, {
            attribute: {
                code: attributeCode
            }
        });

        return !!(correspondingAttributeValue && correspondingAttributeValue.value == "true");
    };

    return _.merge(ATTRIBUTE_CODES, {
        parseAttribute: parseAttribute
    });
});