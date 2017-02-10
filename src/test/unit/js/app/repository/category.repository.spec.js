define(['categoryRepository', 'angularMocks', 'utils', 'customAttributes'], function (CategoryRepository, mocks, utils, customAttributes) {
    describe('categoryRepository', function () {
        var categoryRepository, q, scope, mockStore,
            mockCategoryOptions, mockCategories, mockCategoryCombos, mockCategoryOptionCombos;

        beforeEach(mocks.inject(function ($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            var mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;

            mockCategoryOptions = [{
                id: 'someCategoryOptionId',
                name: 'updatedCategoryName',
                shortName: 'shortName'
            }];

            spyOn(customAttributes, 'getBooleanAttributeValue');

            categoryRepository = new CategoryRepository(mockDB.db, q);
        }));

        describe('categoryOptions', function () {
            beforeEach(function () {
                mockStore.getAll.and.returnValue(utils.getPromise(q, mockCategoryOptions));
            });

            it('should get all category options', function () {
                categoryRepository.getAllCategoryOptions().then(function (categoryOptions) {
                    expect(categoryOptions).toEqual(mockCategoryOptions);
                });
                scope.$apply();
            });

            it('should set excludeFromTotal property from custom attributes', function () {
                customAttributes.getBooleanAttributeValue.and.returnValue('someBooleanValue');
                mockStore.getAll.and.returnValue(utils.getPromise(q, mockCategoryOptions));

                categoryRepository.getAllCategoryOptions().then(function (categoryOptions) {
                    expect(_.first(categoryOptions).excludeFromTotal).toEqual('someBooleanValue');
                });
                scope.$apply();
            });
        });

        describe('categories', function () {
            beforeEach(function () {
                mockCategoryOptions = [{
                    id: 'someCategoryOptionId',
                    name: 'updatedCategoryName',
                    shortName: 'shortName'
                }];

                mockCategories = [{
                    id: 'someCategoryId',
                    categoryOptions: [{
                        id: 'someCategoryOptionId',
                        name: 'oldCategoryOptionName'
                    }]
                }];
            });

            it('should get all categories', function () {
                var actualCategories, expectedCategories;
                expectedCategories = [{ id: 'someCategoryId', categoryOptions: mockCategoryOptions, excludeFromTotal: false }];

                mockStore.getAll.and.returnValues(utils.getPromise(q, mockCategories), utils.getPromise(q, mockCategoryOptions));

                categoryRepository.getAllCategories().then(function (categories) {
                    actualCategories = categories;
                });
                scope.$apply();

                expect(actualCategories).toEqual(expectedCategories);
            });

        });

        describe('categoryCombos', function () {
            beforeEach(function () {
                mockCategoryCombos = [{id: 'someCategoryComboId'}];
            });

            it('should get all category combos', function () {
                var actualCategoryCombos;
                mockStore.getAll.and.returnValue(utils.getPromise(q, mockCategoryCombos));

                categoryRepository.getAllCategoryCombos().then(function (categoryCombos) {
                    actualCategoryCombos = categoryCombos;
                });
                scope.$apply();
                expect(actualCategoryCombos).toEqual(mockCategoryCombos);
            });
        });

        describe('categoryOptionCombos', function () {
            beforeEach(function () {
                mockCategoryOptionCombos = [{
                    id: 'someCategoryOptionComboId',
                    categoryOptions: [{
                        id: 'someCategoryOptionId',
                        name: 'oldCategoryOptionName'
                    }]
                }];
            });

            it('should get all category option combos', function () {
                var actualCategoryOptionCombos, expectedCategoryOptionCombos;
                expectedCategoryOptionCombos = [{ id: 'someCategoryOptionComboId', categoryOptions: mockCategoryOptions, excludeFromTotal: false }];

                mockStore.getAll.and.returnValues(utils.getPromise(q, mockCategoryOptionCombos), utils.getPromise(q, mockCategoryOptions));

                categoryRepository.getAllCategoryOptionCombos().then(function (categoryOptionCombos) {
                    actualCategoryOptionCombos = categoryOptionCombos;
                });

                scope.$apply();
                expect(actualCategoryOptionCombos).toEqual(expectedCategoryOptionCombos);
            });
        });

        describe('enrichWithCategoryOptions', function () {
            beforeEach(function () {
                mockStore.getAll.and.returnValue(utils.getPromise(q, mockCategoryOptions));
            });

            it('should enrich the collection with categoryOptions', function () {
                var item = {
                    categoryOptions: [{
                        id: 'someCategoryOptionId',
                        name: 'oldCategoryOptionName'
                    }]
                };

                categoryRepository.enrichWithCategoryOptions([item]).then(function (enrichedItems) {
                    expect(_.first(enrichedItems).categoryOptions).toEqual(mockCategoryOptions);
                });

                scope.$apply();
            });
        });
    });
});
