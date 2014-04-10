define(["findCategoryComboOption", "lodash"], function(findCategoryComboOption, _) {
    describe("findCategoryComboOption", function() {
        var simpleCategoryOptionCombo;
        var complexCategoryOptionCombo;
        beforeEach(function() {
            simpleCategoryOptionCombo = [{
                "id": 1,
                "name": "(CO1)",
                "categoryCombo": {
                    "id": "CC1"
                },
                "categoryOptions": [{
                    "name": "Resident",
                    "id": "opt1"
                }]
            }, {
                "id": 2,
                "name": "(CO2)",
                "categoryCombo": {
                    "id": "CC1"
                },
                "categoryOptions": [{
                    "name": "Migrant",
                    "id": "op2"
                }]
            }];

            complexCategoryOptionCombo = [{
                "id": 1,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(CO1, CO3)",
                "categoryOptions": [{
                    "name": "Resident",
                    "id": "Resident"
                }, {
                    "name": "LessThan5",
                    "id": "LessThan5"
                }]
            }, {
                "id": 2,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(Resident, CO4)",
                "categoryOptions": [{
                    "name": "Resident",
                    "id": "Resident"
                }, {
                    "name": "GreaterThan5",
                    "id": "GreaterThan5"
                }]
            }, {
                "id": 3,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(CO2, LessThan5)",
                "categoryOptions": [{
                    "name": "Migrant",
                    "id": "Migrant"
                }, {
                    "name": "LessThan5",
                    "id": "LessThan5"
                }]
            }, {
                "id": 4,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(CO2, CO4)",
                "categoryOptions": [{
                    "name": "Migrant",
                    "id": "Migrant"
                }, {
                    "name": "GreaterThan5",
                    "id": "GreaterThan5"
                }]
            }];

        });

        it("should find category combo option id", function() {
            expect(findCategoryComboOption(simpleCategoryOptionCombo, ["Migrant"]).id).toBe(2);
            expect(findCategoryComboOption(simpleCategoryOptionCombo, ["Junk"])).toBe(undefined);
        });

        it("should not find combo option", function() {
            var result1 = findCategoryComboOption(complexCategoryOptionCombo, ["LessThan5", "Migrant", "Something"]);
            expect(result1).toBe(undefined);
            var result2 = findCategoryComboOption(complexCategoryOptionCombo, ["LessThan5"]);
            expect(result1).toBe(undefined);
        });

        it("should find category combo option id", function() {
            var result1 = findCategoryComboOption(complexCategoryOptionCombo, ["LessThan5", "Migrant"]);
            var result2 = findCategoryComboOption(complexCategoryOptionCombo, ["Migrant", "LessThan5"]);
            expect(result1.id).toBe(3);
            expect(result2.id).toBe(3);
        });

    });
});