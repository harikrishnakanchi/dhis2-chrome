define(["lodash"], function(_) {
    var getFilteredDatasets = function(allDatasets, systemSettings, orgUnitId) {
        allDatasets = _.map(allDatasets, function(dataset) {
            dataset.sections = _.map(dataset.sections, function(section) {
                section.dataElements = _.filter(section.dataElements, function(dataElement) {
                    var excludedList = systemSettings.excludedDataElements;
                    return excludedList ? !_.contains(excludedList[orgUnitId], dataElement.id) : true;
                });
                return section;
            });
            return dataset;
        });

        return _.map(allDatasets, function(dataset) {
            dataset.sections = _.filter(dataset.sections, function(section) {
                return section.dataElements.length > 0;
            });
            return dataset;
        });
    };

    var enrichDatasets = function(data) {
        var allDatasets = _.cloneDeep(data[0]);
        var sections = data[1];
        var allDataElements = data[2];

        var groupedSections = _.groupBy(sections, function(section) {
            return section.dataSet.id;
        });

        var addFormNameToDataElement = function(dataElement) {
            var detailedDataElement = _.find(allDataElements, function(d) {
                return d.id === dataElement.id;
            });
            dataElement.formName = detailedDataElement.formName;
            return dataElement;
        };

        _.each(sections, function(section) {
            section.dataElements = _.map(section.dataElements, function(dataElement) {
                return addFormNameToDataElement(dataElement);
            });
        });

        _.each(allDatasets, function(dataset) {
            dataset.dataElements = [];
            dataset.sections = groupedSections[dataset.id];
        });
        return allDatasets;
    };


    return {
        "getFilteredDatasets": getFilteredDatasets,
        "enrichDatasets": enrichDatasets
    };
});