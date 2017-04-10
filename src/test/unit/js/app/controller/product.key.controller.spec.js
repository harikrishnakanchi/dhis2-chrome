define(["productKeyController", "angularMocks", "packagedDataImporter", "utils", "platformUtils", "sessionHelper", "systemSettingRepository", "productKeyUtils"], function(ProductKeyController, mocks, PackagedDataImporter, utils, platformUtils, SessioHelper, SystemSettingRepository, productKeyUtils) {
    describe("productKeyController", function() {
        var scope, location, productKeyController, packagedDataImporter, rootscope, q, sessionHelper, systemSettingRepository, fakeModal;

        beforeEach(mocks.inject(function($rootScope, $location, $q) {
            scope = $rootScope.$new();
            location = $location;
            rootscope = $rootScope;
            q = $q;

            scope.resourceBundle = {
                okLabel: "Ok",
                updateProductKeyMenuLabel: "Update product key"
            };

            fakeModal = {
                close: function() {
                    this.result.confirmCallBack();
                },
                dismiss: function(type) {
                    this.result.cancelCallback(type);
                },
                open: function(object) {}
            };

            spyOn(fakeModal, 'open').and.returnValue({
                result: utils.getPromise(q, {})
            });

            sessionHelper = new SessioHelper();
            systemSettingRepository = new SystemSettingRepository();

            spyOn(systemSettingRepository, "upsertProductKey").and.returnValue(utils.getPromise(q, []));
            spyOn(systemSettingRepository, "getAllowedOrgUnits").and.returnValue(utils.getPromise(q, []));

            spyOn(platformUtils, "sendMessage");

            spyOn(productKeyUtils, "decrypt").and.returnValue(false);

            packagedDataImporter = new PackagedDataImporter();
            spyOn(packagedDataImporter, "run").and.returnValue(utils.getPromise(q, {}));
            spyOn(sessionHelper, "logout");

            productKeyController = new ProductKeyController(scope, location, rootscope, fakeModal, packagedDataImporter, sessionHelper, systemSettingRepository);
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

        it('should get existing allowed orgunits', function () {
            scope.setAuthHeaderAndProceed();
            scope.$apply();

            expect(systemSettingRepository.getAllowedOrgUnits).toHaveBeenCalled();
        });

        it('extract allowed orgunits from newly entered product key', function () {
            scope.setAuthHeaderAndProceed();
            scope.$apply();

            expect(productKeyUtils.decrypt).toHaveBeenCalled();
        });

        it('should show modal message if allowed orgunits in newly entered product key are different from existing product key', function () {
            productKeyUtils.decrypt.and.returnValue({data: {
                allowedOrgUnits: [{id: "IDA"}]
            }});
            scope.setAuthHeaderAndProceed();
            scope.$apply();

            expect(fakeModal.open).toHaveBeenCalled();
        });

        it('should not upsert the product key if user clicks on cancel', function () {
            productKeyUtils.decrypt.and.returnValue({data: {
                allowedOrgUnits: [{id: "IDA"}]
            }});
            fakeModal.open.and.returnValue({
                result: utils.getRejectedPromise(q, {})
            });
            scope.setAuthHeaderAndProceed();
            scope.$apply();
            expect(systemSettingRepository.upsertProductKey).not.toHaveBeenCalled();
        });
    });
});
