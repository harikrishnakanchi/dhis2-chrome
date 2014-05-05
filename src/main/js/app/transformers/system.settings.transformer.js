define(["lodash"], function(_) {

    var constructSystemSettings = function(modules, parent) {
        var returnVal = {
            excludedDataElements: {}
        };

        _.each(modules, function(module) {
            var keys = _.keys(module.selectedDataElements);
            var excludedDataElements = _.map(keys, function(key) {
                return !module.selectedDataElements[key] ? key : undefined;
            });
            excludedDataElements = _.without(excludedDataElements, undefined);
            returnVal.excludedDataElements[module.id] = excludedDataElements;
        });
        return JSON.stringify(returnVal);
    };
    return {
        "constructSystemSettings": constructSystemSettings
    };
});