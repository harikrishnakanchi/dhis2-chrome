define(["selectLanguageController", "angularMocks"],
    function(SelectLanguageController, mocks) {
        describe("selectLanguageController", function() {
            var rootScope, selectLanguageController, translationsService, scope;

            beforeEach(mocks.inject(function($rootScope) {
                scope = $rootScope.$new();
                rootScope = {
                    setLocale: jasmine.createSpy('setLocale')
                };

                selectLanguageController = new SelectLanguageController(scope, rootScope);
            }));

            it("should call setLocale method of translations service with selected locale", function() {

                scope.changeLanguagePreference('fr');
                expect(rootScope.setLocale).toHaveBeenCalledWith('fr');
            });
        });
    });
