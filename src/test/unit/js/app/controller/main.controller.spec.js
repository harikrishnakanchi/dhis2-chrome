define(["mainController", "angularMocks", "utils"], function(MainController, mocks, utils) {
    describe("dashboard controller", function() {
        var rootScope, mainController, scope, httpResponse, q, i18nResourceBundle, getResourceBundleSpy;

        beforeEach(mocks.inject(function($rootScope, $q) {
            scope = $rootScope.$new();
            q = $q;
            rootScope = $rootScope;
            i18nResourceBundle = {
                get: function() {}
            };
            getResourceBundleSpy = spyOn(i18nResourceBundle, "get");
            getResourceBundleSpy.and.returnValue(utils.getPromise(q, {
                "data": {}
            }));
            mainController = new MainController(scope, rootScope, i18nResourceBundle);
        }));

        it("should logout user", function() {
            rootScope.isLoggedIn = true;

            scope.logout();

            expect(rootScope.isLoggedIn).toEqual(false);
        });

        it("should default locale to en", function() {
            scope.$apply();

            expect(rootScope.resourceBundle).toEqual({});
            expect(scope.locale).toEqual("en");
        });

        it("should change resourceBundle if locale changes", function() {
            scope.locale = "fr";
            var frenchResourceBundle = {
                "data": {
                    "login": "french"
                }
            };
            getResourceBundleSpy.and.returnValue(utils.getPromise(q, frenchResourceBundle));

            scope.$apply();

            expect(i18nResourceBundle.get).toHaveBeenCalledWith({
                "locale": "fr"
            });
            expect(rootScope.resourceBundle).toEqual(frenchResourceBundle.data);
        });
    });
});