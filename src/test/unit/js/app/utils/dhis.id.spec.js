define(["dhisId"], function(dhisId) {
    describe("DHIS Id Gen", function() {
        it("should not generate id when name is not defined", function() {
            expect(dhisId.get(undefined)).toEqual(undefined);
        });

        it("should generate id", function() {
            expect(dhisId.get("foo")).not.toBeNull();
        });
    });
});