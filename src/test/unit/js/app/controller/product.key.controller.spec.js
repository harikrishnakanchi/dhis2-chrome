define(["productKeyController", "angularMocks", "packagedDataImporter", "utils", "chromeUtils", "sessionHelper"], function(ProductKeyController, mocks, PackagedDataImporter, utils, chromeUtils, SessioHelper) {
    describe("productKeyController", function() {
        var scope, location, productKeyController, packagedDataImporter, rootscope, q, sessionHelper;

        beforeEach(mocks.inject(function($rootScope, $location, $q) {
            scope = $rootScope.$new();
            location = $location;
            rootscope = $rootScope;
            q = $q;
            sessionHelper = new SessioHelper();

            spyOn(chromeUtils, "sendMessage");
            spyOn(chromeUtils, "setAuthHeader").and.returnValue(utils.getPromise(q, {}));

            packagedDataImporter = new PackagedDataImporter();
            spyOn(packagedDataImporter, "run").and.returnValue(utils.getPromise(q, {}));
            spyOn(sessionHelper, "logout");

            productKeyController = new ProductKeyController(scope, location, rootscope, packagedDataImporter, sessionHelper);
        }));

        it("should set the product key on rootscope and trigger sync", function() {
            scope.productKey = "eyJpdiI6IkZlTlZqYTZxUWRtUjRwTHVybEs2cmc9PSIsInNhbHQiOiJxa045eUIxNS90bz0iLCJjdCI6ImxpR2VTV3Nvb0s2eFdtRTk1WGlGMFFYOFVrbXVTdWJaOGRiYndDTkg3ZjVKdTZWMDNJczR1SGpaV0VWU29CZz0ifQ==";

            scope.$apply();
            scope.setAuthHeaderAndProceed();
            scope.$apply();

            expect(rootscope.authHeader).toEqual("Basic VGV4dCBNZXNzYWdl");
        });

        it("should logout the user if prooduct key is changed and user is logged in", function() {
            scope.productKey = "eyJpdiI6IkZlTlZqYTZxUWRtUjRwTHVybEs2cmc9PSIsInNhbHQiOiJxa045eUIxNS90bz0iLCJjdCI6ImxpR2VTV3Nvb0s2eFdtRTk1WGlGMFFYOFVrbXVTdWJaOGRiYndDTkg3ZjVKdTZWMDNJczR1SGpaV0VWU29CZz0ifQ==";
            rootscope.currentUser = "someUser";

            scope.$apply();
            scope.setAuthHeaderAndProceed();
            scope.$apply();

            expect(sessionHelper.logout).toHaveBeenCalled();
        });

        it("should not try to logout the user if prooduct key is entered for the first time", function() {
            scope.setAuthHeaderAndProceed();
            scope.$apply();

            expect(sessionHelper.logout).not.toHaveBeenCalled();
        });

        it("should send a db ready message after metadata is imported", function() {
            scope.productKey = "eyJpdiI6IkZlTlZqYTZxUWRtUjRwTHVybEs2cmc9PSIsInNhbHQiOiJxa045eUIxNS90bz0iLCJjdCI6ImxpR2VTV3Nvb0s2eFdtRTk1WGlGMFFYOFVrbXVTdWJaOGRiYndDTkg3ZjVKdTZWMDNJczR1SGpaV0VWU29CZz0ifQ==";

            scope.$apply();
            scope.setAuthHeaderAndProceed();
            scope.$apply();
            expect(chromeUtils.sendMessage.calls.argsFor(1)).toEqual(["dbReady"]);
            expect(chromeUtils.sendMessage.calls.argsFor(0)).toEqual(["productKeyDecrypted"]);
        });
    });
});
