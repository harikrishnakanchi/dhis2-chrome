define(["findCategoryComboOption"], function(findCategoryComboOption) {
    return function(categories, categoryCombo, categoryOptionCombos) {
        var prod;
        var headers = [];

        var categoryOptions = _.map(categories, function(category) {
            return category.categoryOptions;
        });

        var cartesianProductOf = function(arr) {
            var multiply = function(arrA, arrB) {
                return _.flatten(_.map(arrA, function(a) {
                    return _.map(arrB, function(b) {
                        a = _.isArray(a) ? a : [a];
                        b = _.isArray(b) ? b : [b];
                        return a.concat(b);
                    });
                }));
            };

            if (arr.length === 1) {
                return _.map(arr[0], function(a) {
                    return [a];
                });
            }

            return _.reduce(arr, function(result, a) {
                headers.push(result);
                return multiply(result, a);
            });
        };

        prod = cartesianProductOf(categoryOptions);
        headers.push(prod);

        var headerLabels = _.map(headers, function(a) {
            return _.map(a, function(b) {
                return _.isArray(b) ? _.last(b) : b;
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
