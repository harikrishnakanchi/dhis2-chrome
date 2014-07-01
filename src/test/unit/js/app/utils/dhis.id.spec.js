define(["dhisId"], function(dhisId) {
    describe("DHIS Id Gen", function() {
        it("should generate id", function() {
            var id = dhisId.get("FooBar");
            expect(id).toEqual("f32a26e2a3a");
        });
    });
});