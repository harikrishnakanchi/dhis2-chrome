define(["lodash"], function(_) {
    return function(categoryOptionCombos, categoryCombo, optionIds) {
        var filteredCategoryOptionCombos = _.filter(categoryOptionCombos, function(catOptCombo) {
            return catOptCombo.categoryCombo.id === categoryCombo.id;
        });
        return _.find(filteredCategoryOptionCombos, function(combo) {
            return _.every(optionIds, function(optionId) {
                return _.any(combo.categoryOptions, {
                    'id': optionId
                });
            });
        });
    };
});