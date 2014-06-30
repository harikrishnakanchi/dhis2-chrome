define(["mainController", "angularMocks", "utils", "userPreferenceRepository"], function(MainController, mocks, utils, UserPreferenceRepository) {
    describe("dashboard controller", function() {
        var rootScope, mainController, scope, httpResponse, q, i18nResourceBundle, getResourceBundleSpy, db,
            translationStore, userPreferenceStore, userPreferenceRepository;

        beforeEach(mocks.inject(function($rootScope, $q) {
            scope = $rootScope.$new();
            q = $q;
            rootScope = $rootScope;
            userPreferenceRepository = new UserPreferenceRepository();

            i18nResourceBundle = {
                get: function() {}
            };

            var queryBuilder = function() {
                this.$index = function() {
                    return this;
                };
                this.$eq = function(v) {
                    return this;
                };
                this.compile = function() {
                    return "blah";
                };
                return this;
            };
            db = {
                "objectStore": function() {},
                "queryBuilder": queryBuilder
            };

            var getMockStore = function(data) {
                var upsert = function() {};
                var find = function() {};
                var each = function() {};

                return {
                    upsert: upsert,
                    find: find,
                    each: each,
                };
            };

            getResourceBundleSpy = spyOn(i18nResourceBundle, "get");
            getResourceBundleSpy.and.returnValue(utils.getPromise(q, {
                "data": {}
            }));

            translationStore = getMockStore("translations");
            userPreferenceStore = getMockStore("userPreferences");

            spyOn(translationStore, "each").and.returnValue(utils.getPromise(q, {}));
            spyOn(db, 'objectStore').and.callFake(function(storeName) {
                if (storeName === "translations")
                    return translationStore;
                if (storeName === "userPreferences")
                    return userPreferenceStore;
            });
            spyOn(userPreferenceStore, 'upsert').and.returnValue(utils.getPromise(q, {
                'username': "1",
                'locale': 'en'
            }));

            mainController = new MainController(scope, rootScope, i18nResourceBundle, db, userPreferenceRepository);
        }));

        it("should logout user", function() {
            rootScope.isLoggedIn = true;

            scope.logout();

            expect(rootScope.isLoggedIn).toEqual(false);
        });

        it("should default locale to en", function() {
            scope.$apply();

            expect(rootScope.resourceBundle).toEqual({});
        });

        it("should change resourceBundle if locale changes", function() {
            rootScope.currentUser = {
                "userCredentials": {
                    "username": "1"
                },
                "organisationUnits": [{
                    "id": "123"
                }]
            };
            rootScope.currentUser.locale = "fr";
            var frenchResourceBundle = {
                "data": {
                    "login": "french"
                }
            };
            spyOn(userPreferenceRepository, "save");
            getResourceBundleSpy.and.returnValue(utils.getPromise(q, frenchResourceBundle));

            scope.$apply();

            expect(i18nResourceBundle.get).toHaveBeenCalledWith({
                "locale": "fr"
            });
            expect(rootScope.resourceBundle).toEqual(frenchResourceBundle.data);
            expect(userPreferenceRepository.save).toHaveBeenCalledWith({
                "username": '1',
                "locale": 'fr',
                "orgUnits": [{
                    "id": '123'
                }]
            });
        });
    });
});