define(["extractHeaders", "lodash"], function(extractHeaders, _) {
    describe("extract headers from category option combos", function() {

        it("should extract headers 2 X 1", function() {
            var categoryOptionCombos = [{
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

            var result = extractHeaders(categoryOptionCombos);

            expect(result).toEqual([
                [{
                    "label": "Resident",
                    "id": 1,
                    "span": 1
                }, {
                    "label": "Migrant",
                    "id": 2,
                    "span": 1
                }]
            ]);
        });

        it("should extract headers 2 X 2", function() {
            var categoryOptionCombos = [{
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

            var result = extractHeaders(categoryOptionCombos);

            expect(result).toEqual([
                [{
                    "label": "Resident",
                    "id": 1,
                    "span": 2
                }, {
                    "label": "Migrant",
                    "id": 3,
                    "span": 2
                }],
                [{
                    "label": "LessThan5",
                    "id": 1,
                    "span": 1
                }, {
                    "label": "GreaterThan5",
                    "id": 2,
                    "span": 1
                }, {
                    "label": "LessThan5",
                    "id": 3,
                    "span": 1
                }, {
                    "label": "GreaterThan5",
                    "id": 4,
                    "span": 1
                }]
            ]);
        });

        it("should extract headers 2 X 2 X 2", function() {
            var categoryOptionCombos = [{
                "id": 1,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(1,a,x)",
                "categoryOptions": [{
                    "name": "1",
                    "id": "1"
                }, {
                    "name": "a",
                    "id": "a"
                }, {
                    "name": "x",
                    "id": "x"
                }]
            }, {
                "id": 2,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(1, a, y)",
                "categoryOptions": [{
                    "name": "1",
                    "id": "1"
                }, {
                    "name": "a",
                    "id": "a"
                }, {
                    "name": "y",
                    "id": "y"
                }]
            }, {
                "id": 3,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(1,b,x)",
                "categoryOptions": [{
                    "name": "1",
                    "id": "1"
                }, {
                    "name": "b",
                    "id": "b"
                }, {
                    "name": "x",
                    "id": "x"
                }]
            }, {
                "id": 4,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(1, b, y)",
                "categoryOptions": [{
                    "name": "1",
                    "id": "1"
                }, {
                    "name": "b",
                    "id": "b"
                }, {
                    "name": "y",
                    "id": "y"
                }]
            }, {
                "id": 5,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(2,a,x)",
                "categoryOptions": [{
                    "name": "2",
                    "id": "2"
                }, {
                    "name": "a",
                    "id": "a"
                }, {
                    "name": "x",
                    "id": "x"
                }]
            }, {
                "id": 6,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(2, a, y)",
                "categoryOptions": [{
                    "name": "2",
                    "id": "2"
                }, {
                    "name": "a",
                    "id": "a"
                }, {
                    "name": "y",
                    "id": "y"
                }]
            }, {
                "id": 7,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(2,b,x)",
                "categoryOptions": [{
                    "name": "2",
                    "id": "2"
                }, {
                    "name": "b",
                    "id": "b"
                }, {
                    "name": "x",
                    "id": "x"
                }]
            }, {
                "id": 8,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(2, b, y)",
                "categoryOptions": [{
                    "name": "2",
                    "id": "2"
                }, {
                    "name": "b",
                    "id": "b"
                }, {
                    "name": "y",
                    "id": "y"
                }]
            }];

            var result = extractHeaders(categoryOptionCombos);

            expect(result).toEqual([
                [{
                    "label": "1",
                    "id": 1,
                    "span": 2
                }, {
                    "label": "2",
                    "id": 5,
                    "span": 2
                }],
                [{
                    "label": "a",
                    "id": 1,
                    "span": 2
                }, {
                    "label": "b",
                    "id": 3,
                    "span": 2
                }, {
                    "label": "a",
                    "id": 5,
                    "span": 2
                }, {
                    "label": "b",
                    "id": 7,
                    "span": 2
                }],
                [{
                    "label": "x",
                    "id": 1,
                    "span": 1
                }, {
                    "label": "y",
                    "id": 2,
                    "span": 1
                }, {
                    "label": "x",
                    "id": 3,
                    "span": 1
                }, {
                    "label": "y",
                    "id": 4,
                    "span": 1
                }, {
                    "label": "x",
                    "id": 5,
                    "span": 1
                }, {
                    "label": "y",
                    "id": 6,
                    "span": 1
                }, {
                    "label": "x",
                    "id": 7,
                    "span": 1
                }, {
                    "label": "y",
                    "id": 8,
                    "span": 1
                }]
            ]);
        });

        it("should extract headers 1 X 2 X 3", function() {
            var categoryOptionCombos = [{
                "id": 1,
                "categoryCombo": {
                    "id": "CC"
                },
                "name": "(1,a,x)",
                "categoryOptions": [{
                    "name": "1",
                    "id": "1"
                }, {
                    "name": "a",
                    "id": "a"
                }, {
                    "name": "x",
                    "id": "x"
                }]
            }, {
                "id": 2,
                "categoryCombo": {
                    "id": "CC"
                },
                "name": "(1, a, y)",
                "categoryOptions": [{
                    "name": "1",
                    "id": "1"
                }, {
                    "name": "a",
                    "id": "a"
                }, {
                    "name": "y",
                    "id": "y"
                }]
            }, {
                "id": 3,
                "categoryCombo": {
                    "id": "CC"
                },
                "name": "(1, a, z)",
                "categoryOptions": [{
                    "name": "1",
                    "id": "1"
                }, {
                    "name": "a",
                    "id": "a"
                }, {
                    "name": "z",
                    "id": "z"
                }]
            }, {
                "id": 4,
                "categoryCombo": {
                    "id": "CC"
                },
                "name": "(1,b,x)",
                "categoryOptions": [{
                    "name": "1",
                    "id": "1"
                }, {
                    "name": "b",
                    "id": "b"
                }, {
                    "name": "x",
                    "id": "x"
                }]
            }, {
                "id": 5,
                "categoryCombo": {
                    "id": "CC"
                },
                "name": "(1, b, y)",
                "categoryOptions": [{
                    "name": "1",
                    "id": "1"
                }, {
                    "name": "b",
                    "id": "b"
                }, {
                    "name": "y",
                    "id": "y"
                }]
            }, {
                "id": 6,
                "categoryCombo": {
                    "id": "CC"
                },
                "name": "(1, b, z)",
                "categoryOptions": [{
                    "name": "1",
                    "id": "1"
                }, {
                    "name": "b",
                    "id": "b"
                }, {
                    "name": "z",
                    "id": "z"
                }]
            }];

            var result = extractHeaders(categoryOptionCombos);

            expect(result).toEqual([
                [{
                    "label": "1",
                    "id": 1,
                    "span": 2
                }],
                [{
                    "label": "a",
                    "id": 1,
                    "span": 3
                }, {
                    "label": "b",
                    "id": 4,
                    "span": 3
                }],
                [{
                    "label": "x",
                    "id": 1,
                    "span": 1
                }, {
                    "label": "y",
                    "id": 2,
                    "span": 1
                }, {
                    "label": "z",
                    "id": 3,
                    "span": 1
                }, {
                    "label": "x",
                    "id": 4,
                    "span": 1
                }, {
                    "label": "y",
                    "id": 5,
                    "span": 1
                }, {
                    "label": "z",
                    "id": 6,
                    "span": 1
                }]
            ]);
        });
    });
});