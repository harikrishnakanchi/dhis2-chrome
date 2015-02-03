define(["lodashUtils"], function(_) {
    describe("lodashUtils", function() {
        it("should do a union of two lists based on callback", function() {
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

            var actualResult = _.unionBy([list1, list2], "id");

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
    });
});
