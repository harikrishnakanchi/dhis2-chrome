define(["lodash", "customAttributes"], function (_, CustomAttributes) {
    return function (db) {
        var store = db.objectStore("dataElements");

        var transformDataElement = function (dataElement) {
            dataElement.offlineSummaryType = CustomAttributes.getAttributeValue(dataElement.attributeValues, CustomAttributes.LINE_LIST_OFFLINE_SUMMARY_CODE);
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
