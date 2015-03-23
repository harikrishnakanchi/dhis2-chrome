define(["lodash", "extractHeaders"], function(_, extractHeaders) {
    var enrichGroupedSections = function(data) {
        var dataSets = data[0];
        var sections = data[1];
        var dataElements = data[2];
        var categoryCombos = data[3];
        var categories = data[4];
        var categoryOptionCombos = data[5];

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
                section.orgUnitIds = [];
                _.each(dataSets, function(ds) {
                    if (ds.id === section.dataSet.id) {
                        section.orgUnits = ds.organisationUnits;
                    }
                });
                section.headers = result.headers;
                section.categoryOptionComboIds = result.categoryOptionComboIds;
                return section;
            });
        });
        return returnVal;
    };

    var filterDataElements = function(sections, excludedDataElements) {
        var filteredSections = _.map(sections, function(section) {
            section = _.clone(section);
            section.dataElements = _.filter(section.dataElements, function(dataElement) {
                return !_.contains(excludedDataElements, dataElement.id);
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
