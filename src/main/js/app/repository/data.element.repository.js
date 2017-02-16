define(["lodash", "customAttributes"], function (_, customAttributes) {
    return function (db, $q, optionSetRepository) {
        var store = db.objectStore("dataElements");

        var addCustomAttributeFields = function (dataElement) {
            dataElement.offlineSummaryType = customAttributes.getAttributeValue(dataElement.attributeValues, customAttributes.LINE_LIST_OFFLINE_SUMMARY_CODE);
            dataElement.showInEventSummary = customAttributes.getBooleanAttributeValue(dataElement.attributeValues, customAttributes.SHOW_IN_EVENT_SUMMARY_CODE);
            return dataElement;
        };

        var getOptionSet = function (dataElement, optionSets) {
            var optionSetId = dataElement.optionSet && dataElement.optionSet.id;
            return _.find(optionSets, {id: optionSetId});
        };

        var addOptionSet = function (dataElement, optionSets) {
            var optionSet = getOptionSet(dataElement, optionSets);
            if (optionSet) {
                dataElement.optionSet = optionSet;
            }
            return dataElement;
        };

        var transformDataElement = function (dataElement, optionSets) {
            dataElement = addOptionSet(dataElement, optionSets);
            return addCustomAttributeFields(dataElement);
        };

        this.get = function (dataElementId) {
            return $q.all({
                dataElement: store.find(dataElementId),
                optionSets: optionSetRepository.getAll()
            }).then(function (data) {
                return transformDataElement(data.dataElement, data.optionSets);
            });
        };

        this.findAll = function (dataElementIds) {
            var query = db.queryBuilder().$in(dataElementIds).compile();
            return $q.all({
                dataElements: store.each(query),
                optionSets: optionSetRepository.getAll()
            }).then(function (data) {
                return _.map(data.dataElements, _.partial(transformDataElement, _, data.optionSets));
            });
        };

        this.enrichWithDataElementsDetails = function (dataElements) {
             return this.findAll(_.map(dataElements, 'id')).then(function (dataElementsFromStore) {
                 var indexedDataElements = _.indexBy(dataElementsFromStore, 'id');
                 return _.map(dataElements, function (dataElement) {
                     return _.merge(dataElement, _.pick(indexedDataElements[dataElement.id], ['name', 'formName', 'description', 'translations']));
                 });
             });
        };
    };
});
