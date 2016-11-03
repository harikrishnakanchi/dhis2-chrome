define(['dataEntryTableColumnConfig', 'lodash'], function(dataEntryTableColumnConfig, _) {
    describe('dataEntryTableColumnConfig', function () {
        describe('generate', function () {
            var categoryOptionA, categoryOptionB, categoryOptionX, categoryOptionY, categories,
                categoryOptionCombo1, categoryOptionCombo2, categoryOptionCombo3, categoryOptionCombo4, categoryOptionCombos;

            beforeEach(function () {
                categoryOptionA = { id: 'categoryOptionIdA', name: 'categoryOptionNameA', excludeFromTotal: false };
                categoryOptionB = { id: 'categoryOptionIdB', name: 'categoryOptionNameB', excludeFromTotal: false };
                categoryOptionX = { id: 'categoryOptionIdX', name: 'categoryOptionNameX', excludeFromTotal: false };
                categoryOptionY = { id: 'categoryOptionIdY', name: 'categoryOptionNameY', excludeFromTotal: true };

                categories = [
                    { name: 'category1', categoryOptions: [categoryOptionA, categoryOptionB] },
                    { name: 'category2', categoryOptions: [categoryOptionX, categoryOptionY] }
                ];

                categoryOptionCombo1 = { id: 'categoryOptionComboId1', categoryOptions: [categoryOptionA, categoryOptionX] };
                categoryOptionCombo2 = { id: 'categoryOptionComboId2', categoryOptions: [categoryOptionA, categoryOptionY] };
                categoryOptionCombo3 = { id: 'categoryOptionComboId3', categoryOptions: [categoryOptionB, categoryOptionX] };
                categoryOptionCombo4 = { id: 'categoryOptionComboId4', categoryOptions: [categoryOptionB, categoryOptionY] };

                categoryOptionCombos = [categoryOptionCombo1, categoryOptionCombo2, categoryOptionCombo3, categoryOptionCombo4];
            });

            it('should return column configuration using cartesian product of category options', function () {
                var expectedResult = [
                    [{
                        name: categoryOptionA.name,
                        categoryOptions: [categoryOptionA]
                    }, {
                        name: categoryOptionB.name,
                        categoryOptions: [categoryOptionB]
                    }],
                    [{
                        name: categoryOptionX.name,
                        categoryOptions: [categoryOptionA, categoryOptionX],
                        categoryOptionComboId: categoryOptionCombo1.id,
                        excludeFromTotal: false
                    }, {
                        name: categoryOptionY.name,
                        categoryOptions: [categoryOptionA, categoryOptionY],
                        categoryOptionComboId: categoryOptionCombo2.id,
                        excludeFromTotal: true
                    }, {
                        name: categoryOptionX.name,
                        categoryOptions: [categoryOptionB, categoryOptionX],
                        categoryOptionComboId: categoryOptionCombo3.id,
                        excludeFromTotal: false
                    }, {
                        name: categoryOptionY.name,
                        categoryOptions: [categoryOptionB, categoryOptionY],
                        categoryOptionComboId: categoryOptionCombo4.id,
                        excludeFromTotal: true
                    }]
                ];

                expect(dataEntryTableColumnConfig.generate(categories, categoryOptionCombos)).toEqual(expectedResult);
            });
        });
    });
});
