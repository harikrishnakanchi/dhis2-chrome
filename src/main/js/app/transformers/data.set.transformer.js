define(["dataEntryTableColumnConfig", "lodash", "customAttributes"], function(dataEntryTableColumnConfig, _, customAttributes) {
    this.mapDatasetForView = function(dataset) {
        var resultDataset = _.pick(dataset, ["id", "name", "shortName", "code", "sections", "translations"]);
        resultDataset.isAggregateService = !customAttributes.getBooleanAttributeValue(dataset.attributeValues, customAttributes.LINE_LIST_ATTRIBUTE_CODE) &&
            !customAttributes.getBooleanAttributeValue(dataset.attributeValues, customAttributes.ORIGIN_DATA_SET_CODE) &&
            !customAttributes.getBooleanAttributeValue(dataset.attributeValues, customAttributes.REFERRAL_DATA_SET_CODE) &&
            !customAttributes.getBooleanAttributeValue(dataset.attributeValues, customAttributes.POPULATION_DATA_SET_CODE);
        resultDataset.isLineListService = customAttributes.getBooleanAttributeValue(dataset.attributeValues, customAttributes.LINE_LIST_ATTRIBUTE_CODE);
        resultDataset.isOriginDataset = customAttributes.getBooleanAttributeValue(dataset.attributeValues, customAttributes.ORIGIN_DATA_SET_CODE);
        resultDataset.isNewDataModel = customAttributes.getBooleanAttributeValue(dataset.attributeValues, customAttributes.NEW_DATA_MODEL_CODE);
        resultDataset.isReferralDataset = customAttributes.getBooleanAttributeValue(dataset.attributeValues, customAttributes.REFERRAL_DATA_SET_CODE);
        resultDataset.isPopulationDataset = customAttributes.getBooleanAttributeValue(dataset.attributeValues, customAttributes.POPULATION_DATA_SET_CODE);
        resultDataset.serviceCode = customAttributes.getAttributeValue(dataset.attributeValues, customAttributes.SERVICE_CODE);
        return resultDataset;
    };

    this.enrichWithSectionsAndDataElements = function(allDatasets, allSections, allDataElements, excludedDataElements, dataElementGroups) {
        var indexedSections = _.indexBy(allSections, "id");
        var indexedDataElements = _.indexBy(allDataElements, "id");

        var enrichSections = function(sections) {
            return _.map(sections, function(section) {
                var enrichedSection = _.pick(indexedSections[section.id], "id", "name", "sortOrder", "dataElements", "translations");
                enrichedSection.dataElements = enrichDataElements(enrichedSection.dataElements);
                enrichedSection.isIncluded = !_.every(enrichedSection.dataElements, {
                    "isIncluded": false
                });
                enrichedSection.shouldHideTotals = _.any(enrichedSection.dataElements,{
                    "shouldHideTotals": true
                });
                return enrichedSection;
            });
        };

        var getSubSection = function(dataElement) {
            return _.filter(dataElementGroups, function(group) {
                return _.any(group.dataElements, {
                    "id": dataElement.id
                });
            });
        };

        var enrichDataElements = function(dataElements) {
            return _.map(dataElements, function(dataElement) {
                var enrichedDataElement = _.pick(indexedDataElements[dataElement.id], "id", "name", "formName", "categoryCombo", "description", "code", "translations");
                enrichedDataElement.isIncluded = _.isEmpty(excludedDataElements) ? true : !_.contains(excludedDataElements, dataElement.id);
                enrichedDataElement.isMandatory = customAttributes.getBooleanAttributeValue(indexedDataElements[dataElement.id].attributeValues, customAttributes.MANDATORY_CODE);
                var subSection = getSubSection(enrichedDataElement)[0] || {
                    "name": "Default"
                };
                enrichedDataElement.shouldHideTotals = customAttributes.getBooleanAttributeValue(indexedDataElements[dataElement.id].attributeValues, customAttributes.HIDE_AGGREGATE_DATA_SET_SECTION_TOTALS);
                enrichedDataElement.subSection = subSection.name;

                var populationDataElementCode = customAttributes.getAttributeValue(indexedDataElements[dataElement.id].attributeValues, customAttributes.PRAXIS_POPULATION_DATA_ELEMENTS);
                if(populationDataElementCode)
                    enrichedDataElement.populationDataElementCode = populationDataElementCode;
                return enrichedDataElement;
            });
        };

        return _.map(allDatasets, function(dataset) {
            dataset.sections = enrichSections(dataset.sections);
            return dataset;
        });
    };

    this.enrichWithColumnConfigurations = function(dataSets, allCategoryCombos, allCategories, allCategoryOptionCombos) {

        return _.map(dataSets, function(dataSet) {
            _.each(dataSet.sections, function(section) {
                var categoryComboId = _.first(section.dataElements).categoryCombo.id,
                    categoryCombo = _.find(allCategoryCombos, { id: categoryComboId }),
                    categoryOptionCombos = _.filter(allCategoryOptionCombos, { categoryCombo: { id: categoryComboId } });

                var categories = _.map(categoryCombo.categories, function(category) {
                    return _.find(allCategories, { id: category.id });
                });

                section.columnConfigurations = dataEntryTableColumnConfig.generate(categories, categoryOptionCombos);
                section.baseColumnConfiguration = _.last(section.columnConfigurations);
                section.categoryOptionComboIdsForTotals = _.chain(section.baseColumnConfiguration)
                    .reject('excludeFromTotal')
                    .map('categoryOptionComboId')
                    .value();
            });

            return dataSet;
        });
    };

    return this;
});
