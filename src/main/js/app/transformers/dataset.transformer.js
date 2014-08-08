define(["lodash"], function(_) {

    var enrichDatasets = function(allDatasets, allSections, allDataElements, moduleId, excludedDataElements) {
        allDatasets = _.cloneDeep(allDatasets);
        allSections = _.cloneDeep(allSections);
        allDataElements = _.cloneDeep(allDataElements);

        var groupedSections = _.groupBy(allSections, function(section) {
            return section.dataSet.id;
        });

        var addFormNameToDataElement = function(dataElement) {
            var detailedDataElement = _.find(allDataElements, function(d) {
                return d.id === dataElement.id;
            });
            dataElement.formName = detailedDataElement.formName;
            return dataElement;
        };

        _.each(allSections, function(section) {
            section.dataElements = _.map(section.dataElements, function(dataElement) {
                dataElement.isIncluded = moduleId && excludedDataElements ? !_.contains(excludedDataElements[moduleId], dataElement.id) : true;
                return addFormNameToDataElement(dataElement);
            });
        });

        _.each(allDatasets, function(dataset) {
            dataset.dataElements = [];
            dataset.sections = _.map(groupedSections[dataset.id], function(section) {
                section.isIncluded = _.any(section.dataElements, {
                    "isIncluded": true
                });
                return section;
            });
        });

        return allDatasets;
    };

    var getAssociatedDatasets = function(orgUnit, datasets) {
        return _.filter(datasets, {
            'organisationUnits': [{
                'id': orgUnit.id
            }]
        });
    };

    return {
        "enrichDatasets": enrichDatasets,
        "getAssociatedDatasets": getAssociatedDatasets
    };
});