define(["lodash", "customAttributes"], function (_, customAttributes) {
    return function (db, $q, optionSetRepository) {
        var store = db.objectStore("dataElements");

        var addCustomAttributeFields = function (dataElement) {
            dataElement.offlineSummaryType = customAttributes.getAttributeValue(dataElement.attributeValues, customAttributes.LINE_LIST_OFFLINE_SUMMARY_CODE);
            dataElement.showInEventSummary = customAttributes.getBooleanAttributeValue(dataElement.attributeValues, customAttributes.SHOW_IN_EVENT_SUMMARY_CODE);
            return dataElement;
        };

        var addOptionSet = function (dataElement) {
            var optionSetId = dataElement.optionSet && dataElement.optionSet.id;
            if (optionSetId) {
                dataElement.optionSet = optionSetRepository.get(optionSetId);
            }
            return $q.all(dataElement);
        };

        var transformDataElement = function (dataElement) {
            return addOptionSet(dataElement).then(addCustomAttributeFields);
        };

        this.get = function (dataElementId) {
            return store.find(dataElementId)
                .then(transformDataElement);
        };

        this.findAll = function (dataElementIds) {
            return $q.all(_.map(dataElementIds, this.get));
        };

        this.enrichWithDataElementsDetails = function (dataElements) {
             return this.findAll(_.map(dataElements,'id')).then(function (dataElementsFromStore) {
                 var indexedDataElements = _.indexBy(dataElementsFromStore, 'id');
                 return _.map(dataElements, function (dataElement) {
                     return _.merge(dataElement, _.pick(indexedDataElements[dataElement.id], ['name', 'formName', 'description', 'translations']));
                 });
             });
        };
    };
});
