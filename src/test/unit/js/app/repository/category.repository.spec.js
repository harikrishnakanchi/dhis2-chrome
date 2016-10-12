define(['categoryRepository', 'angularMocks', 'utils'], function (CategoryRepository, mocks, utils) {
    describe('categoryRepository', function () {
        var categoryRepository, q, scope, mockStore,
            mockCategoryOptions, mockCategories, mockCategoryCombos, mockCategoryOptionCombos;

        beforeEach(mocks.inject(function ($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            var mockDB = utils.getMockDB(q);
            mockStore = mockDB.objectStore;

            categoryRepository = new CategoryRepository(mockDB.db, q);
        }));

        describe('categoryOptions', function () {
            beforeEach(function () {
                mockCategoryOptions = [{id: 'someCategoryOptionId'}];
            });

            it('should get all category options', function () {
                var actualCategoryOptions;
                mockStore.getAll.and.returnValue(utils.getPromise(q, mockCategoryOptions));

                categoryRepository.getAllCategoryOptions().then(function (categoryOptions) {
                    actualCategoryOptions = categoryOptions;
                });
                scope.$apply();
                expect(actualCategoryOptions).toEqual(mockCategoryOptions);
            });
        });

        describe('categories', function () {
            beforeEach(function () {
                mockCategoryOptions = [{
                    id: 'someCategoryOptionId',
                    name: 'updatedCategoryName'
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
                expectedCategories = [{ id: 'someCategoryId', categoryOptions: mockCategoryOptions }];

                mockStore.getAll.and.returnValues(utils.getPromise(q, mockCategoryOptions), utils.getPromise(q, mockCategories));

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
                mockCategoryOptions = [{
                    id: 'someCategoryOptionId',
                    name: 'updatedCategoryName'
                }];

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
                expectedCategoryOptionCombos = [{ id: 'someCategoryOptionComboId', categoryOptions: mockCategoryOptions }];

                mockStore.getAll.and.returnValues(utils.getPromise(q, mockCategoryOptions), utils.getPromise(q, mockCategoryOptionCombos));

                categoryRepository.getAllCategoryOptionCombos().then(function (categoryOptionCombos) {
                    actualCategoryOptionCombos = categoryOptionCombos;
                });

                scope.$apply();
                expect(actualCategoryOptionCombos).toEqual(expectedCategoryOptionCombos);
            });
        });
    });
});
