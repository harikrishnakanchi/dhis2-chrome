define(["productKeyController", "angularMocks", "packagedDataImporter", "utils", "platformUtils", "sessionHelper", "systemSettingRepository"], function(ProductKeyController, mocks, PackagedDataImporter, utils, platformUtils, SessioHelper, SystemSettingRepository) {
    describe("productKeyController", function() {
        var scope, location, productKeyController, packagedDataImporter, rootscope, q, sessionHelper, systemSettingRepository;

        beforeEach(mocks.inject(function($rootScope, $location, $q) {
            scope = $rootScope.$new();
            location = $location;
            rootscope = $rootScope;
            q = $q;
            sessionHelper = new SessioHelper();
            systemSettingRepository = new SystemSettingRepository();

            spyOn(systemSettingRepository, "upsertProductKey").and.returnValue(utils.getPromise(q, []));

            spyOn(platformUtils, "sendMessage");
            spyOn(platformUtils, "setAuthHeader").and.returnValue(utils.getPromise(q, {}));

            packagedDataImporter = new PackagedDataImporter();
            spyOn(packagedDataImporter, "run").and.returnValue(utils.getPromise(q, {}));
            spyOn(sessionHelper, "logout");

            productKeyController = new ProductKeyController(scope, location, rootscope, packagedDataImporter, sessionHelper, systemSettingRepository);
        }));

        it("should upsert product key  and trigger sync", function() {
            scope.productKey = "eyJpdiI6IkZlTlZqYTZxUWRtUjRwTHVybEs2cmc9PSIsInNhbHQiOiJxa045eUIxNS90bz0iLCJjdCI6ImxpR2VTV3Nvb0s2eFdtRTk1WGlGMFFYOFVrbXVTdWJaOGRiYndDTkg3ZjVKdTZWMDNJczR1SGpaV0VWU29CZz0ifQ==";

            scope.$apply();
            scope.setAuthHeaderAndProceed();
            scope.$apply();

            expect(systemSettingRepository.upsertProductKey).toHaveBeenCalledWith({
                "key": "productKey",
                "value": "eyJpdiI6IkZlTlZqYTZxUWRtUjRwTHVybEs2cmc9PSIsInNhbHQiOiJxa045eUIxNS90bz0iLCJjdCI6ImxpR2VTV3Nvb0s2eFdtRTk1WGlGMFFYOFVrbXVTdWJaOGRiYndDTkg3ZjVKdTZWMDNJczR1SGpaV0VWU29CZz0ifQ=="
            });
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
            expect(platformUtils.sendMessage.calls.argsFor(1)).toEqual(["dbReady"]);
            expect(platformUtils.sendMessage.calls.argsFor(0)).toEqual(["productKeyDecrypted"]);
        });
    });
});
