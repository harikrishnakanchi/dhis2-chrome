define(["lodash"], function(_) {
    return function(categoryOptionCombos, categoryCombo, options) {
        var filteredCategoryOptionCombos = _.filter(categoryOptionCombos, function(catOptCombo) {
            return catOptCombo.categoryCombo.id === categoryCombo.id;
        });
        return _.find(filteredCategoryOptionCombos, function(combo) {
            return _.every(options, function(option) {
                return _.any(combo.categoryOptions, {
                    'name': option
                });
            });
        });
    };
});