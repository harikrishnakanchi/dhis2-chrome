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
                var filteredDataElements =
                    _.pluck(_.filter(section.dataElements, {
                        "isIncluded": false
                    }), "id");
                excludedDataElements = excludedDataElements.concat(filteredDataElements);
            });
        });
        return excludedDataElements;
    };


    var excludedDataElementsForLinelistModule = function(module) {
        var excludedDataElements = [];
        var program = module.enrichedProgram;
        _.each(program.programStages, function(programStage) {
            _.each(programStage.programStageSections, function(section) {
                var filteredDataElements = _.filter(section.programStageDataElements, {
                    "dataElement": {
                        "isIncluded": false
                    }
                });
                _.each(filteredDataElements, function(de) {
                    excludedDataElements.push(de.dataElement.id);
                });
            });
        });
        return excludedDataElements;
    };

    var constructSystemSettings = function(modules, isLineList) {
        return isLineList ? excludedDataElements(modules) : createAggregateModulesSystemSetting(modules);
    };

    return {
        "constructSystemSettings": constructSystemSettings,
        "excludedDataElementsForLinelistModule": excludedDataElementsForLinelistModule,
        "excludedDataElementsForAggregateModule": excludedDataElementsForAggregateModule
    };
});