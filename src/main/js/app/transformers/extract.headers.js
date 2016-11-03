define(["lodash"], function(_) {

    var generate = function(categories, categoryOptionCombos) {

        var findCategoryOptionComboId = function(categoryOptions) {
            var requiredCategoryOptionIds = _.map(categoryOptions, 'id');

            return _.find(categoryOptionCombos, function(categoryOptionCombo) {
                return _.isEmpty(_.xor(requiredCategoryOptionIds, _.map(categoryOptionCombo.categoryOptions, 'id')));
            }).id;
        };

        var columnConfigurations = _.transform(categories, function (columnConfigurations, category) {
            var previousColumnConfig = _.last(columnConfigurations);

            if(previousColumnConfig) {
                columnConfigurations.push(_.flatten(_.map(previousColumnConfig, function (previousColumnConfigItem) {
                    return _.map(category.categoryOptions, function (categoryOption) {
                        return {
                            name: categoryOption.name,
                            categoryOptions: previousColumnConfigItem.categoryOptions.concat([categoryOption])
                        };
                    });
                })));
            } else {
                columnConfigurations.push(_.map(category.categoryOptions, function (categoryOption) {
                    return {
                        name: categoryOption.name,
                        categoryOptions: [categoryOption]
                    };
                }));
            }
        }, []);

        var baseColumnConfiguration = _.last(columnConfigurations);
        _.each(baseColumnConfiguration, function (columnConfigItem) {
            columnConfigItem.excludeFromTotal = _.any(columnConfigItem.categoryOptions, 'excludeFromTotal');
            columnConfigItem.categoryOptionComboId = findCategoryOptionComboId(columnConfigItem.categoryOptions);
        });

        return columnConfigurations;
    };

    return {
        generate: generate
    };
});
