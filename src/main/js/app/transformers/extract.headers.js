define(["findCategoryComboOption"], function(findCategoryComboOption) {
    return function(categories, categoryCombo, categoryOptionCombos) {
        var prod;
        var headers = [];

        var categoryOptions = _.map(categories, function(category) {
            return category.categoryOptions;
        });

        var cartesianProductOf = function(arr) {
            return _.reduce(arr, function(a, b) {
                headers.push(a);
                return _.flatten(_.map(a, function(x) {
                    return _.map(b, function(y) {
                        return x.concat([y]);
                    });
                }), true);
            }, [
                []
            ]);
        };

        prod = cartesianProductOf(categoryOptions);
        headers.push(prod);
        headers.shift();

        var headerLabels = _.map(headers, function(a) {
            return _.map(a, function(b) {
                return _.last(b).name;
            });
        });

        var comboIds = _.map(prod, function(a) {
            var combo = findCategoryComboOption(categoryOptionCombos, categoryCombo, _.pluck(a, "name"));
            return combo.id;
        });

        return {
            "headers": headerLabels,
            "categoryOptionComboIds": comboIds
        };
    };
});