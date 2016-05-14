define(["selectLanguageController", "translationsService", "angularMocks", "utils"],
    function(SelectLanguageController, TranslationsService, mocks, utils) {
        describe("selectLanguageController", function() {
            var rootScope, selectLanguageController, translationsService, scope;

            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                q = $q;
                rootScope = $rootScope;

                translationsService = new TranslationsService();
                spyOn(translationsService, 'setLocale').and.returnValue(utils.getPromise(q, {}));

                selectLanguageController = new SelectLanguageController(scope, rootScope, translationsService);
            }));

            it("should call setLocale method of translations service with selected locale", function() {

                scope.changeLanguagePreference('fr');

                expect(rootScope.locale).toEqual('fr');
                expect(translationsService.setLocale).toHaveBeenCalledWith('fr');
            });
        });
    });
