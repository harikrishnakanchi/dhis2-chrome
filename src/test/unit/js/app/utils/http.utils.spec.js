define(["httpUtils"], function(httpUtils) {
    describe("httpUtils", function() {
        it("should generate param string with filter", function() {
            var filterKey = "name";
            var filterValues = ["n1", "n2", "n3"];

            var actualString = httpUtils.getParamString(filterKey, filterValues);
            expect(actualString).toEqual("filter=name:eq:n1&filter=name:eq:n2&filter=name:eq:n3&fields=:all&paging=false");
        });
    });
});
