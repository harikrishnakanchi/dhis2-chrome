define(["lodash"], function(_) {

    var createAggregateModulesSystemSetting = function(modules) {
        var returnVal = {};

        _.each(modules, function(module) {
            var excludedDataElements = [];
            _.each(module.associatedDatasets, function(ds) {
                _.each(ds.sections, function(section) {
                    excludedDataElements = excludedDataElements.concat(
                        _.pluck(_.filter(section.dataElements, {
                            "isIncluded": false
                        }), "id"));
                });
            });

            returnVal[module.id] = excludedDataElements;
        });

        return returnVal;
    };

    var excludedDataElementsForAggregateModule = function(associatedDatasets) {
        var excludedDataElements = [];
        _.each(associatedDatasets, function(ds) {
            _.each(ds.sections, function(section) {
                var filteredDataElements = _.transform(section.dataElements, function(result, de) {
                    if (de.isIncluded === false)
                        result.push(_.pick(de, "id"));
                }, []);
                excludedDataElements = excludedDataElements.concat(filteredDataElements);
            });
        });
        return excludedDataElements;
    };


    var excludedDataElementsForLinelistModule = function(enrichedProgram) {
        var excludedDataElements = [];
        _.each(enrichedProgram.programStages, function(programStage) {
            _.each(programStage.programStageSections, function(section) {
                var filteredDataElements = _.transform(section.programStageDataElements, function(result, psde) {
                    if (psde.dataElement.isIncluded === false)
                        result.push(_.pick(psde.dataElement, "id"));
                }, []);
                excludedDataElements = excludedDataElements.concat(filteredDataElements);
            });
        });
        return excludedDataElements;
    };

    return {
        "excludedDataElementsForLinelistModule": excludedDataElementsForLinelistModule,
        "excludedDataElementsForAggregateModule": excludedDataElementsForAggregateModule
    };
});
