define(["lodash", "customAttributes"], function (_, customAttributes) {
    return function (db) {
        var store = db.objectStore("dataElements");

        var transformDataElement = function (dataElement) {
            dataElement.offlineSummaryType = customAttributes.getAttributeValue(dataElement.attributeValues, customAttributes.LINE_LIST_OFFLINE_SUMMARY_CODE);
            dataElement.showInEventSummary = customAttributes.getBooleanAttributeValue(dataElement.attributeValues, customAttributes.SHOW_IN_EVENT_SUMMARY_CODE);
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

        this.enrichWithDataElementsDetails = function (dataElements) {
             return this.findAll(_.map(dataElements,'id')).then(function (dataElementsFromStore) {
                 var indexedDataElements = _.indexBy(dataElementsFromStore, 'id');
                 return _.map(dataElements, function (dataElement) {
                     return _.merge(dataElement, _.pick(indexedDataElements[dataElement.id], ['name', 'formName', 'description']));
                 });
             });
        };
    };
});
