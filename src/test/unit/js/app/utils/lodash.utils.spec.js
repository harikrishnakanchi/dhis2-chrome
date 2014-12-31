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
    });
});
