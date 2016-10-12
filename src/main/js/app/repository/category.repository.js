define(['lodash'], function (_) {
    return function (db, $q) {
        var CATEGORY_OPTIONS_STORE = 'categoryOptions',
            CATEGORIES_STORE = 'categories',
            CATEGORY_COMBOS_STORE = 'categoryCombos',
            CATEGORY_OPTION_COMBOS_STORE = 'categoryOptionCombos';

        var enrichCollectionWithCategoryOptions = function (collection, categoryOptions) {
            var indexedCategoryOptions = _.indexBy(categoryOptions, 'id');

            return _.each(collection, function (item) {
                _.each(item.categoryOptions, function (categoryOption) {
                    categoryOption.name = _.get(indexedCategoryOptions[categoryOption.id], 'name');
                });
            });
        };

        this.getAllCategoryOptions = function () {
            var store = db.objectStore(CATEGORY_OPTIONS_STORE);
            return store.getAll();
        };

        this.getAllCategories = function () {
            var categoriesStore = db.objectStore(CATEGORIES_STORE),
                categoryOptionsStore = db.objectStore(CATEGORY_OPTIONS_STORE);

            return $q.all({
                categoryOptions: categoryOptionsStore.getAll(),
                categories: categoriesStore.getAll()
            }).then(function (data) {
                var categories = data.categories,
                    categoryOptions = data.categoryOptions;

                return enrichCollectionWithCategoryOptions(categories, categoryOptions);
            });
        };

        this.getAllCategoryCombos = function () {
            var store = db.objectStore(CATEGORY_COMBOS_STORE);
            return store.getAll();
        };

        this.getAllCategoryOptionCombos = function () {
            var categoryOptionCombosStore = db.objectStore(CATEGORY_OPTION_COMBOS_STORE);
            var categoryOptionsStore = db.objectStore(CATEGORY_OPTIONS_STORE);

            return $q.all({
                categoryOptions: categoryOptionsStore.getAll(),
                categoryOptionCombos: categoryOptionCombosStore.getAll()
            }).then(function (data) {
                var categoryOptionCombos = data.categoryOptionCombos,
                    categoryOptions = data.categoryOptions;

                return enrichCollectionWithCategoryOptions(categoryOptionCombos, categoryOptions);
            });
        };
    };
});
