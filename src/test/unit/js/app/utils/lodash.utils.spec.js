define(["lodashUtils"], function(_) {
    describe("lodashUtils", function() {
        it("should do a union of lists based on callback", function() {
            var list1 = [{
                "id": 1,
                "name": "n1"
            }, {
                "id": 2,
                "name": "n2"
            }];
            var list2 = [{
                "id": 3,
                "name": "n3"
            }, {
                "id": 2,
                "name": "n2"
            }];
            var list3 = [{
                "id": 4,
                "name": "n3"
            }, {
                "id": 3,
                "name": "n2"
            }];

            var actualResult = _.unionBy([list1, list2, list3], "id");

            expect(actualResult).toEqual([list1[0], list1[1], list2[0], list3[0]]);
        });

        it("should ignore undefined lists while doing a union", function() {
            var list1 = [{
                "id": 1,
                "name": "n1"
            }, {
                "id": 2,
                "name": "n2"
            }];
            var list2 = [{
                "id": 3,
                "name": "n3"
            }, {
                "id": 2,
                "name": "n2"
            }];

            var actualResult = _.unionBy([list1, undefined, list2], "id");

            expect(actualResult).toEqual([list1[0], list1[1], list2[0]]);
        });

        it("should do a xor of two lists based on the key", function() {
            var list1 = [{
                'name': "test1",
                "id": "t1"
            }, {
                'name': "test2",
                "id": "t2"
            }];

            var list2 = [{
                'name': "test1",
                "id": "t1"
            }, {
                'name': "test3",
                "id": "t3"
            }];

            var actualResult = _.xorBy(list1, list2, "name");

            expect(actualResult).toEqual(["test2", "test3"]);
        });

        it("should group objects by a key which is collection", function() {
            var ds1 = {
                "id": "ds1",
                "name": "ds1",
                "orgUnitIds": ["ou1", "ou2", "ou3"]
            };

            var ds2 = {
                "id": "ds2",
                "name": "ds2",
                "orgUnitIds": ["ou2", "ou3"]
            };

            var ds3 = {
                "id": "ds3",
                "name": "ds3",
                "orgUnitIds": ["ou2", "ou3", "ou4"]
            };

            var datasets = [ds1, ds2, ds3];

            var expectedResult = {
                "ou1": [ds1],
                "ou2": [ds1, ds2, ds3],
                "ou3": [ds1, ds2, ds3],
                "ou4": [ds3]
            };

            var actualResult = _.groupByArray(datasets, "orgUnitIds");

            expect(actualResult).toEqual(expectedResult);
        });

        it("should give difference of two object arrays by given key", function() {
            var arr1 = [{
                "id": 1,
                "name": "one"
            }, {
                "id": 2,
                "name": "two"
            }, {
                "id": 3,
                "name": "three"
            }];

            var arr2 = [{
                "id": 3,
                "name": "three"
            }, {
                "id": 4,
                "name": "four"
            }];

            var expectedResult = [{
                "id": 1,
                "name": "one"
            }, {
                "id": 2,
                "name": "two"
            }];

            var actualResult = _.differenceBy(arr1, arr2, "id");

            expect(actualResult).toEqual(expectedResult);
        });

        describe("minWhile test suite", function() {
            it("should return minimum object from a collection based on natural ordering of given key", function() {
                var collection = [{
                    "name": "name3",
                    "age": 3
                }, {
                    "name": "name2",
                    "age": 2
                }, {
                    "name": "name1",
                    "age": 1
                }];

                var expectedResult = collection[2];
                var actualResult = _.minWhile(collection, "age");

                expect(actualResult).toEqual(expectedResult);
            });

            it("should return first occurence of minimum object from a collection based on given custom order array", function() {
                var collection = [{
                    "name": "Senior Manager",
                    "designation": "Senior Manager"
                }, {
                    "name": "Junior Manager",
                    "designation": "Junior Manager"
                }, {
                    "name": "Manager",
                    "designation": "Manager"
                }];

                var customOrderOfDesignations = ["Junior Manager", "Manager", "Senior Manager"];

                var expectedResult = collection[1];
                var actualResult = _.minWhile(collection, "designation", customOrderOfDesignations);

                expect(actualResult).toEqual(expectedResult);
            });

            it("should return first occurence of minimum object from a collection based on given custom order object", function() {
                var collection = [{
                    "name": "Junior Manager Dept 1",
                    "designation": "Junior Manager Dept 1"
                }, {
                    "name": "Junior Manager Dept 2",
                    "designation": "Junior Manager Dept 2"
                }, {
                    "name": "Manager Dept 1",
                    "designation": "Manager Dept 1"
                }, {
                    "name": "Senior Manager Dept 1",
                    "designation": "Senior Manager Dept 1"
                }];

                var customOrderOfDesignations = {
                    "Junior Manager Dept 1": 1,
                    "Junior Manager Dept 2": 1,
                    "Manager Dept 1": 2,
                    "Manager Dept 2": 2,
                    "Senior Manager Dept 1": 3,
                    "Senior Manager Dept 2": 3
                };

                var expectedResult = collection[0];
                var actualResult = _.minWhile(collection, "designation", customOrderOfDesignations);

                expect(actualResult).toEqual(expectedResult);
            });

            it("should throw an error if custom order array doesn't have all the values", function() {
                var collection = [{
                    "name": "Senior Manager",
                    "designation": "Senior Manager"
                }, {
                    "name": "Junior Manager",
                    "designation": "Junior Manager"
                }, {
                    "name": "Manager",
                    "designation": "Manager"
                }];

                var customOrderOfDesignations = ["Senior Manager"];

                var functionCall = function() {
                    return _.minWhile(collection, "designation", customOrderOfDesignations);
                };

                expect(functionCall).toThrow("Custom order is not known for [Junior Manager,Manager]");
            });

            it("should throw an error if custom order object doesn't have all the values", function() {
                var collection = [{
                    "name": "Engineer Level 1",
                    "designation": "Engineer Level 1"
                }, {
                    "name": "Consultant Level 1",
                    "designation": "Consultant Level 1"
                }, {
                    "name": "Engineer Level 2",
                    "designation": "Engineer Level 2"
                }, {
                    "name": "Consultant Level 3",
                    "designation": "Consultant Level 3"
                }];

                var customOrderOfDesignations = {
                    "Engineer Level 1": 1,
                    "Consultant Level 1": 1
                };

                var functionCall = function() {
                    _.minWhile(collection, "designation", customOrderOfDesignations);
                };

                expect(functionCall).toThrow("Custom order is not known for [Engineer Level 2,Consultant Level 3]");
            });

            it("should throw an error if custom order object values are not numbers", function() {
                var collection = [{
                    "name": "Engineer Level 1",
                    "designation": "Engineer Level 1"
                }];

                var customOrderOfDesignations = {
                    "Engineer Level 1": "1",
                    "Consultant Level 1": "2"
                };

                var functionCall = function() {
                    _.minWhile(collection, "designation", customOrderOfDesignations);
                };

                expect(functionCall).toThrow("Custom order values should be integers");
            });

            it("should throw an error if custom order is not an arry or an object", function() {
                var collection = [{
                    "name": "Engineer Level 1",
                    "designation": "Engineer Level 1"
                }];

                var customOrderOfDesignations = "someOrder";

                var functionCall = function() {
                    _.minWhile(collection, "designation", customOrderOfDesignations);
                };

                expect(functionCall).toThrow("Unsupported custom order type");
            });
        });
    });
});
