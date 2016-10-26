define(["extractHeaders", "lodash", "customAttributes"], function(extractHeaders, _, CustomAttributes) {
    this.mapDatasetForView = function(dataset) {
        var resultDataset = _.pick(dataset, ["id", "name", "shortName", "code", "sections"]);
        resultDataset.isAggregateService = !CustomAttributes.getBooleanAttributeValue(dataset.attributeValues, CustomAttributes.LINE_LIST_ATTRIBUTE_CODE) &&
            !CustomAttributes.getBooleanAttributeValue(dataset.attributeValues, CustomAttributes.ORIGIN_DATA_SET_CODE) &&
            !CustomAttributes.getBooleanAttributeValue(dataset.attributeValues, CustomAttributes.REFERRAL_DATA_SET_CODE) &&
            !CustomAttributes.getBooleanAttributeValue(dataset.attributeValues, CustomAttributes.POPULATION_DATA_SET_CODE);
        resultDataset.isLineListService = CustomAttributes.getBooleanAttributeValue(dataset.attributeValues, CustomAttributes.LINE_LIST_ATTRIBUTE_CODE);
        resultDataset.isOriginDataset = CustomAttributes.getBooleanAttributeValue(dataset.attributeValues, CustomAttributes.ORIGIN_DATA_SET_CODE);
        resultDataset.isNewDataModel = CustomAttributes.getBooleanAttributeValue(dataset.attributeValues, CustomAttributes.NEW_DATA_MODEL_CODE);
        resultDataset.isReferralDataset = CustomAttributes.getBooleanAttributeValue(dataset.attributeValues, CustomAttributes.REFERRAL_DATA_SET_CODE);
        resultDataset.isPopulationDataset = CustomAttributes.getBooleanAttributeValue(dataset.attributeValues, CustomAttributes.POPULATION_DATA_SET_CODE);
        return resultDataset;
    };

    this.enrichWithSectionsAndDataElements = function(allDatasets, allSections, allDataElements, excludedDataElements, dataElementGroups) {
        var indexedSections = _.indexBy(allSections, "id");
        var indexedDataElements = _.indexBy(allDataElements, "id");

        var enrichSections = function(sections) {
            return _.map(sections, function(section) {
                var enrichedSection = _.pick(indexedSections[section.id], "id", "name", "sortOrder", "dataElements");
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
                var enrichedDataElement = _.pick(indexedDataElements[dataElement.id], "id", "name", "formName", "categoryCombo", "description", "code");
                var associatedProgram = CustomAttributes.getAttributeValue(indexedDataElements[dataElement.id].attributeValues, CustomAttributes.ASSOCIATED_PROGRAM_CODE);
                if (!_.isEmpty(associatedProgram))
                    enrichedDataElement.associatedProgramId = associatedProgram;
                enrichedDataElement.isIncluded = _.isEmpty(excludedDataElements) ? true : !_.contains(excludedDataElements, dataElement.id);
                enrichedDataElement.isMandatory = CustomAttributes.getBooleanAttributeValue(indexedDataElements[dataElement.id].attributeValues, CustomAttributes.MANDATORY_CODE);
                var subSection = getSubSection(enrichedDataElement)[0] || {
                    "name": "Default"
                };
                enrichedDataElement.shouldHideTotals = CustomAttributes.getBooleanAttributeValue(indexedDataElements[dataElement.id].attributeValues, CustomAttributes.HIDE_AGGREGATE_DATA_SET_SECTION_TOTALS);
                enrichedDataElement.subSection = subSection.name;

                var populationDataElementCode = CustomAttributes.getAttributeValue(indexedDataElements[dataElement.id].attributeValues, CustomAttributes.PRAXIS_POPULATION_DATA_ELEMENTS);
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

    this.enrichWithCategoryOptionCombinations = function(dataSets, allCategoryCombos, allCategories, allCategoryOptionCombos) {
        var enrichedCategories = function(categoryComboId) {
            var categories = _.find(allCategoryCombos, _.matchesProperty('id', categoryComboId)).categories;
            return _.map(categories, function(category) {
                return _.find(allCategories, _.matchesProperty('id', category.id));
            });
        };

        return _.map(dataSets, function(dataSet) {
            _.each(dataSet.sections, function(section) {
                var categoryCombo = _.first(section.dataElements).categoryCombo;
                var categories = enrichedCategories(categoryCombo.id);
                var result = extractHeaders(categories, categoryCombo, allCategoryOptionCombos);
                section.headers = result.headers;
                section.categoryOptionComboIds = result.categoryOptionComboIds;
                section.categoryOptionComboIdsForTotals = _.pluck(_.reject(allCategoryOptionCombos, function(catOptCombo) {
                    return _.endsWith(catOptCombo.code, "excludeFromTotal") || !_.contains(section.categoryOptionComboIds, catOptCombo.id);
                }), "id");
                return section;
            });

            return dataSet;
        });
    };

    return this;
});
