define(["extractHeaders", "lodash"], function(extractHeaders, _) {

    var categoryOptions = [];
    beforeEach(function() {
        categoryOptions = [{
            "name": "Resident",
            "id": "Resident"
        }, {
            "name": "Migrant",
            "id": "Migrant"
        }, {
            "name": "LessThan5",
            "id": "LessThan5"
        }, {
            "name": "GreaterThan5",
            "id": "GreaterThan5"
        }, {
            "name": "New",
            "id": "New"
        }, {
            "name": "FollowUp",
            "id": "FollowUp"
        }];
    });

    describe("extract headers from category option combos", function() {
        it("should extract headers 2 X 1", function() {

            var categories = [{
                id: 'cat1',
                categoryOptions: [categoryOptions[0], categoryOptions[1]]
            }];

            var categoryOptionCombos = [{
                "id": 1,
                "name": "(CO1)",
                "categoryCombo": {
                    "id": "CC1"
                },
                "categoryOptions": [categoryOptions[0]]
            }, {
                "id": 2,
                "name": "(CO2)",
                "categoryCombo": {
                    "id": "CC1"
                },
                "categoryOptions": [categoryOptions[1]]
            }];

            var result = extractHeaders("sec1", categories, categoryOptionCombos);

            expect(result.headers).toEqual([
                ["Resident", "Migrant"]
            ]);
            expect(result.categoryOptionComboIds).toEqual(['1sec1', '2sec1']);
        });

        it("should extract headers 2 X 2", function() {
            var categories = [{
                id: 'cat1',
                categoryOptions: [categoryOptions[0], categoryOptions[1]]
            }, {
                id: 'cat1',
                categoryOptions: [categoryOptions[2], categoryOptions[3]]
            }];

            var categoryOptionCombos = [{
                "id": 1,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(CO1, CO3)",
                "categoryOptions": [categoryOptions[0], categoryOptions[2]]
            }, {
                "id": 2,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(Resident, CO4)",
                "categoryOptions": [categoryOptions[0], categoryOptions[3]]
            }, {
                "id": 3,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(CO2, LessThan5)",
                "categoryOptions": [categoryOptions[2], categoryOptions[1]]
            }, {
                "id": 4,
                "categoryCombo": {
                    "id": "CC1"
                },
                "name": "(CO2, CO4)",
                "categoryOptions": [categoryOptions[1], categoryOptions[3]]
            }];

            var result = extractHeaders("test", categories, categoryOptionCombos);

            expect(result.headers).toEqual(
                [
                    [
                        "Resident", "Migrant"
                    ],
                    [
                        "LessThan5", "GreaterThan5", "LessThan5", "GreaterThan5"
                    ]
                ]
            );
            expect(result.categoryOptionComboIds).toEqual(['1test', '2test', '3test', '4test']);
        });

        it("should extract headers 1 X 2 X 3", function() {

            var categories = [{
                id: 'cat1',
                categoryOptions: [{
                    "name": "1",
                    "id": "1"
                }]
            }, {
                id: 'cat2',
                categoryOptions: [{
                    "name": "a",
                    "id": "a"
                }, {
                    "name": "b",
                    "id": "b"
                }]
            }, {
                id: 'cat3',
                categoryOptions: [{
                    "name": "x",
                    "id": "x"
                }, {
                    "name": "y",
                    "id": "y"
                }, {
                    "name": "z",
                    "id": "z"
                }]
            }];

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
                    "name": "b",
                    "id": "b"
                }, {
                    "name": "y",
                    "id": "y"
                }, {
                    "name": "1",
                    "id": "1"
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

            var result = extractHeaders("blah", categories, categoryOptionCombos);

            expect(result.headers).toEqual([
                ["1"],
                ["a", "b"],
                ["x", "y", "z", "x", "y", "z"]
            ]);

            expect(result.categoryOptionComboIds).toEqual(['1blah', '2blah', '3blah', '4blah', '5blah', '6blah']);
        });
    });
});