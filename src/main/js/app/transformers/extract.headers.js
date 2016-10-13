define(["lodash", "findCategoryComboOption"], function(_, findCategoryComboOption) {
    return function(categories, categoryCombo, categoryOptionCombos) {

        var cartesianProductOf = function(twoDimensionalArray) {
            var multiply = function(arrA, arrB) {
                return _.flatten(_.map(arrA, function(a) {
                    return _.map(arrB, function(b) {
                        a = _.isArray(a) ? a : [a];
                        b = _.isArray(b) ? b : [b];
                        return a.concat(b);
                    });
                }));
            };

            return twoDimensionalArray.length === 1 ?
                _.map(_.first(twoDimensionalArray), function(a) { return [a]; }) :
                _.reduce(twoDimensionalArray, function(result, a) { return multiply(result, a); });
        };

        var arrayOfCategoryOptions = _.map(categories, 'categoryOptions');

        var headerLabels = _.reduce(arrayOfCategoryOptions, function (result, categoryOptions) {
            var previousItemLength = _.get(_.last(result), 'length', 1);
            var headers = [];
            _.times(previousItemLength, function () {
                headers.push(categoryOptions);
            });
            result.push(_.flatten(headers));
            return result;
        }, []);

        var comboIds = _.map(cartesianProductOf(arrayOfCategoryOptions), function(categoryOptions) {
            var combo = findCategoryComboOption(categoryOptionCombos, categoryCombo, _.map(categoryOptions, "id"));
            return combo.id;
        });

        return {
            "headers": headerLabels,
            "categoryOptionComboIds": comboIds
        };
    };
});
