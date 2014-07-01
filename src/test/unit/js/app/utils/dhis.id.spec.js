define(["dhisId"], function(dhisId) {
    describe("DHIS Id Gen", function() {
        it("should generate id", function() {
            expect(dhisId.get("FooBar")).toEqual("3858f62230a");
            expect(dhisId.get("FOOBAR")).toEqual("3858f62230a");
            expect(dhisId.get(undefined)).toEqual(undefined);
        });
    });
});