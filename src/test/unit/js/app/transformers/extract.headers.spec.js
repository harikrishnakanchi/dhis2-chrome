define(['extractHeaders', 'lodash'], function(extractHeaders, _) {

    var categoryOption1, categoryOption2, categoryOption3, categoryOption4, categoryOption5, categoryOption6, categoryCombo, categories,
        categoryOptionCombos, categoryOptionComboA, categoryOptionComboB, categoryOptionComboC, categoryOptionComboD;

    beforeEach(function () {
        categoryOption1 = {
            id: 'categoryOptionId1',
            name: 'categoryOptionName1'
        };

        categoryOption2 = {
            id: 'categoryOptionId2',
            name: 'categoryOptionName2'
        };

        categoryOption3 = {
            id: 'categoryOptionId3',
            name: 'categoryOptionName3'
        };

        categoryOption4 = {
            id: 'categoryOptionId4',
            name: 'categoryOptionName4'
        };

        categoryOption5 = {
            id: 'categoryOptionId5',
            name: 'categoryOptionName5'
        };

        categoryOption6 = {
            id: 'categoryOptionId6',
            name: 'categoryOptionName6'
        };

        categoryCombo = {
            "id": "someCategoryComboId"
        };

        categories = [{
            id: 'categoryId1',
            categoryOptions: [categoryOption1]
        }, {
            id: 'categoryId2',
            categoryOptions: [categoryOption2, categoryOption3]
        }, {
            id: 'categoryId3',
            categoryOptions: [categoryOption4, categoryOption5]
        }];

        categoryOptionComboA = {
            id: 'categoryOptionComboIdA',
            categoryCombo: categoryCombo,
            categoryOptions: [categoryOption1, categoryOption2, categoryOption4]
        };
        categoryOptionComboB = {
            id: 'categoryOptionComboIdB',
            categoryCombo: categoryCombo,
            categoryOptions: [categoryOption1, categoryOption2, categoryOption5]
        };
        categoryOptionComboC = {
            id: 'categoryOptionComboIdC',
            categoryCombo: categoryCombo,
            categoryOptions: [categoryOption1, categoryOption3, categoryOption4]
        };
        categoryOptionComboD = {
            id: 'categoryOptionComboIdD',
            categoryCombo: categoryCombo,
            categoryOptions: [categoryOption1, categoryOption3, categoryOption5]
        };
        categoryOptionCombos = [categoryOptionComboA, categoryOptionComboB, categoryOptionComboC, categoryOptionComboD];
    });

    describe('headers', function() {
        it('should extract headers 1 X 2 X 3', function() {
            var result = extractHeaders(categories, categoryCombo, categoryOptionCombos);

            expect(result.headers).toEqual([
                [categoryOption1],
                [categoryOption2, categoryOption3],
                [categoryOption4, categoryOption5, categoryOption4, categoryOption5]
            ]);
        });
    });

    describe('categoryOptionComboIds', function () {
        it('should extract categoryOptionComboIds', function () {
            var result = extractHeaders(categories, categoryCombo, categoryOptionCombos);

            expect(result.categoryOptionComboIds).toEqual([categoryOptionComboA.id, categoryOptionComboB.id, categoryOptionComboC.id, categoryOptionComboD.id]);
        });
    });
});
