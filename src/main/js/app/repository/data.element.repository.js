define(["lodash", "customAttributes"], function (_, CustomAttributes) {
    return function (db) {
        var store = db.objectStore("dataElements");

        var transformDataElement = function (dataElement) {

            // TODO: remove offlineSummaryCodeFromCodeAttribute once all fields are upto date with latest DHIS metadata
            var getOfflineSummaryCode = function (de) {
                var offlineSummaryCode = CustomAttributes.getAttributeValue(de.attributeValues, CustomAttributes.LINE_LIST_OFFLINE_SUMMARY_CODE);
                var offlineSummaryCodeFromCodeAttribute = _.contains(de.code, '_') && _.last(de.code.split('_'));
                return offlineSummaryCode || offlineSummaryCodeFromCodeAttribute;
            };

            dataElement.offlineSummaryType = getOfflineSummaryCode(dataElement);
            dataElement.showInEventSummary = CustomAttributes.getBooleanAttributeValue(dataElement.attributeValues, CustomAttributes.SHOW_IN_EVENT_SUMMARY_CODE);
            return dataElement;
        };

        this.get = function (dataElementId) {
            return store.find(dataElementId)
                .then(transformDataElement);
        };

        this.findAll = function (dataElementIds) {
            var query = db.queryBuilder().$in(dataElementIds).compile();
            return store.each(query).then(function (dataElements) {
                return _.map(dataElements, transformDataElement);
            });
        };
    };
});
