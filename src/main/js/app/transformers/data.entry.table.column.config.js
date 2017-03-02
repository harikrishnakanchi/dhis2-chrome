define(["lodash"], function(_) {

    var generate = function(categories, categoryOptionCombos) {

        var findCategoryOptionComboId = function(categoryOptions) {
            var requiredCategoryOptionIds = _.map(categoryOptions, 'id');

            return _.find(categoryOptionCombos, function(categoryOptionCombo) {
                return _.isEmpty(_.xor(requiredCategoryOptionIds, _.map(categoryOptionCombo.categoryOptions, 'id')));
            }).id;
        };

        var setValue = function (obj, property, value) {
            return value ? _.set(obj, property, value) : obj;
        };

        var columnConfigurations = _.transform(categories, function (columnConfigurations, category) {
            var previousColumnConfig = _.last(columnConfigurations);

            if(previousColumnConfig) {
                columnConfigurations.push(_.flatten(_.map(previousColumnConfig, function (previousColumnConfigItem) {
                    return _.map(category.categoryOptions, function (categoryOption) {
                        var columnConfig = {
                            name: categoryOption.name,
                            id: categoryOption.id,
                            categoryOptions: previousColumnConfigItem.categoryOptions.concat([categoryOption])
                        };
                        return setValue(columnConfig, 'translations', categoryOption.translations);
                    });
                })));
            } else {
                columnConfigurations.push(_.map(category.categoryOptions, function (categoryOption) {
                    var columnConfig = {
                        name: categoryOption.name,
                        id: categoryOption.id,
                        categoryOptions: [categoryOption]
                    };
                    return setValue(columnConfig, 'translations', categoryOption.translations);
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
