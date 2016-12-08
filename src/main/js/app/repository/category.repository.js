define(['customAttributes', 'lodash'], function (CustomAttributes, _) {
    return function (db, $q) {
        var CATEGORY_OPTIONS_STORE = 'categoryOptions',
            CATEGORIES_STORE = 'categories',
            CATEGORY_COMBOS_STORE = 'categoryCombos',
            CATEGORY_OPTION_COMBOS_STORE = 'categoryOptionCombos';

        var _this = this;

        _this.getAllCategoryOptions = function () {
            var store = db.objectStore(CATEGORY_OPTIONS_STORE);
            return store.getAll().then(function (categoryOptions) {
                return _.each(categoryOptions, function (categoryOption) {
                    categoryOption.excludeFromTotal = CustomAttributes.getBooleanAttributeValue(categoryOption.attributeValues, CustomAttributes.EXCLUDE_FROM_TOTAL);
                });
            });
        };

        _this.enrichWithCategoryOptions = function (collection) {
            return _this.getAllCategoryOptions().then(function (categoryOptions) {
                var indexedCategoryOptions = _.indexBy(categoryOptions, 'id');

                return _.each(_.compact(collection), function (item) {
                    item.categoryOptions = _.map(item.categoryOptions, function (categoryOption) {
                        return indexedCategoryOptions[categoryOption.id];
                    });
                });
            });
        };

        _this.getAllCategories = function () {
            var categoriesStore = db.objectStore(CATEGORIES_STORE);
            return categoriesStore.getAll().then(_this.enrichWithCategoryOptions);
        };

        _this.getAllCategoryCombos = function () {
            var store = db.objectStore(CATEGORY_COMBOS_STORE);
            return store.getAll();
        };

        _this.getAllCategoryOptionCombos = function () {
            var categoryOptionCombosStore = db.objectStore(CATEGORY_OPTION_COMBOS_STORE);
            return categoryOptionCombosStore.getAll().then(_this.enrichWithCategoryOptions);
        };
    };
});
