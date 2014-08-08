define(["lodash"], function(_) {

    var constructSystemSettings = function(modules) {
        var returnVal = {
            excludedDataElements: {}
        };

        _.each(modules, function(module) {
            var excludedDataElements = [];
            _.each(module.datasets, function(ds) {
                _.each(ds.sections, function(section) {
                    excludedDataElements = excludedDataElements.concat(
                        _.pluck(_.filter(section.dataElements, {
                            "isIncluded": false
                        }), "id"));
                });
            });

            returnVal.excludedDataElements[module.id] = excludedDataElements;
        });

        return returnVal;
    };
    return {
        "constructSystemSettings": constructSystemSettings
    };
});