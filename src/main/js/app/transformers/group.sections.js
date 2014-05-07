define(["lodash", "extractHeaders"], function(_, extractHeaders) {
    var enrichGroupedSections = function(data) {

        var dataElements = data[2];
        var sections = data[1];
        var categoryCombos = data[3];
        var categories = data[4];
        var categoryOptionCombos = data[5];
        var moduleId = 'moduleId';

        var groupedSections = _.groupBy(sections, function(section) {
            return section.dataSet.id;
        });

        var getDetailedCategory = function(category) {
            return _.find(categories, function(c) {
                return c.id === category.id;
            });
        };

        var enrichDataElement = function(dataElement) {
            var detailedDataElement = _.find(dataElements, function(d) {
                return d.id === dataElement.id;
            });
            var detailedCategoryCombo = _.find(categoryCombos, function(c) {
                return c.id === detailedDataElement.categoryCombo.id;
            });

            var detailedCategories = _.map(detailedCategoryCombo.categories, getDetailedCategory);
            dataElement.categories = detailedCategories;
            dataElement.categoryCombo = detailedDataElement.categoryCombo;
            dataElement.formName = detailedDataElement.formName;
            return dataElement;
        };

        var returnVal = _.mapValues(groupedSections, function(sections) {
            return _.map(sections, function(section) {
                section.dataElements = _.map(section.dataElements, enrichDataElement);
                var result = extractHeaders(section.dataElements[0].categories, section.dataElements[0].categoryCombo, categoryOptionCombos);
                section.headers = result.headers;
                section.categoryOptionComboIds = result.categoryOptionComboIds;
                return section;
            });
        });
        return returnVal;
    };

    var filterDataElements = function(sections, moduleId, systemSettings, parentId) {
        var systemSetting = _.find(systemSettings, function(s) {
            return s.id === parentId;
        });
        var filteredSections = _.map(sections, function(section) {
            section.dataElements = _.filter(section.dataElements, function(dataElement) {
                var excludedList = systemSetting.excludedDataElements;
                return excludedList ? !_.contains(excludedList[moduleId], dataElement.id) : true;
            });
            return section;
        });
        return _.filter(filteredSections, function(section) {
            return section.dataElements.length > 0;
        });
    };

    return {
        "enrichGroupedSections": enrichGroupedSections,
        "filterDataElements": filterDataElements
    };

});