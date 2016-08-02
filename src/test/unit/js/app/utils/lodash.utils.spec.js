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

        it("should return true or false based on whether array contains an object by comparing the given key", function() {
            var arr = [{
                "id": 1,
                "name": "one"
            }, {
                "id": 2,
                "name": "two"
            }, {
                "id": 3,
                "name": "three"
            }];

            var obj1 = {
                "id": 3,
                "name": "three"
            };

            var obj2 = {
                "id": 4,
                "name": "four"
            };

            expect(_.containsBy(arr, obj1, "id")).toBeTruthy();
            expect(_.containsBy(arr, obj2, "id")).toBeFalsy();
        });

        it("should return intersection of two lists based on given key", function() {
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
                "id": 3,
                "name": "three"
            }];

            var actualResult = _.intersectionBy(arr1, arr2, "id");

            expect(actualResult).toEqual(expectedResult);
        });
    });
});
