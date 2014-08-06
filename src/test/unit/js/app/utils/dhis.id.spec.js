define(["dhisId"], function(dhisId) {
    describe("DHIS Id Gen", function() {
        it("should generate id", function() {
            expect(dhisId.get("FooBar")).toEqual("a3858f62230");
            expect(dhisId.get("FOOBAR")).toEqual("a3858f62230");
            expect(dhisId.get(undefined)).toEqual(undefined);
        });
    });
});