define(["productKeyController", "angularMocks", "metadataImporter", "utils", "chromeUtils"], function(ProductKeyController, mocks, MetadataImporter, utils, chromeUtils) {
    describe("productKeyController", function() {
        var scope, location, productKeyController, metadataImporter, rootscope, q;

        beforeEach(mocks.inject(function($rootScope, $location, $q) {
            scope = $rootScope.$new();
            location = $location;
            rootscope = $rootScope;
            q = $q;

            spyOn(chromeUtils, "sendMessage");
            spyOn(chromeUtils, "setAuthHeader").and.returnValue(utils.getPromise(q, {}));

            metadataImporter = new MetadataImporter();
            spyOn(metadataImporter, "run").and.returnValue(utils.getPromise(q, {}));

            productKeyController = new ProductKeyController(scope, location, rootscope, metadataImporter);
        }));

        it("should set the product key on rootscope and trigger sync", function() {
            scope.productKey = "eyJpdiI6IldrbWRjaERvR0RhYmRWVmozbFVHeXc9PSIsInNhbHQiOiJGYU90RkVlM1E1dz0iLCJjdCI6ImpUQVJ0UWxXOE96TlltTFNsWCtCNzlDY2l1ST0ifQ==";

            scope.$apply();
            scope.setAuthHeaderAndProceed();
            scope.$apply();

            expect(rootscope.auth_header).toEqual("Test Message");
        });
    });
});
