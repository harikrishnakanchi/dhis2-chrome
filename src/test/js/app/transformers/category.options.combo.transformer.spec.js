define(["categoryOptionsComboTransformer", "lodash"], function(transformer, _) {
    describe("categoryOptionsComboTransformer", function() {

        it("should extract headers", function() {
            var categoryOptionCombos = [{
                "id": 0,
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

            var result = _.reduce(categoryOptionCombos, transformer, []);

            expect(result).toEqual([
                ["Resident", "Migrant"]
            ]);
        });

        it("should extract headers", function() {
            var categoryOptionCombos = [{
                "id": 0,
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
                "id": 1,
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

            var result = _.reduce(categoryOptionCombos, transformer, []);

            expect(result).toEqual([
                ["Resident", "Migrant"],
                ["LessThan5", "GreaterThan5", "LessThan5", "GreaterThan5"]
            ]);
        });
    });
});