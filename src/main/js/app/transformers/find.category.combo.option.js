define(["lodash"], function(_) {
    return function(catageroryOptionCombos, options) {
        return _.find(catageroryOptionCombos, function(combo) {
            return _.every(options, function(option) {
                return _.any(combo.categoryOptions, {
                    'name': option
                });
            });
        });
    };
});