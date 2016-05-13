define(["selectLanguageController","systemSettingRepository", "translationsService", "angularMocks", "utils"],
    function(SelectLanguageController, SystemSettingRepository, TranslationsService, mocks, utils) {
        describe("selectLanguageController", function() {
            var rootScope, selectLanguageController, systemSettingRepository, translationsService, scope, i18nResourceBundle, getResourceBundleSpy, db, frenchResourceBundle,
                translationStore;

            beforeEach(mocks.inject(function($rootScope, $q, $location) {
                scope = $rootScope.$new();
                q = $q;
                rootScope = $rootScope;

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

                systemSettingRepository = new SystemSettingRepository();
                spyOn(systemSettingRepository, 'upsertLocale').and.returnValue(utils.getPromise(q, {}));

                translationsService = new TranslationsService();
                spyOn(translationsService, 'setLocale').and.returnValue(utils.getPromise(q, {}));

                translationStore = getMockStore("translations");

                spyOn(translationStore, "each").and.returnValue(utils.getPromise(q, {}));
                spyOn(db, 'objectStore').and.callFake(function(storeName) {
                    return translationStore;
                });

                selectLanguageController = new SelectLanguageController(scope, rootScope, q, db, i18nResourceBundle, systemSettingRepository, translationsService);
            }));

            it("should change resourceBundle if locale changes", function() {
                rootScope.locale = 'fr';
                frenchResourceBundle = {
                    "data": {
                        "login": "french"
                    }
                };
                getResourceBundleSpy.and.returnValue(utils.getPromise(q, frenchResourceBundle));

                scope.changeLanguagePreference("fr");
                scope.$apply();

                expect(i18nResourceBundle.get).toHaveBeenCalledWith({
                    "locale": "fr"
                });
                expect(rootScope.resourceBundle).toEqual(frenchResourceBundle.data);
            });
        });
    });
