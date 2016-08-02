define(['footerController', 'systemSettingRepository', 'chromeUtils', 'angularMocks'], function(FooterController, SystemSettingRepository, chromeUtils, mocks) {
    describe('FooterController', function() {
        var controller, rootScope, scope,
            systemSettingRepository;

        beforeEach(mocks.inject(function($rootScope) {
            rootScope = $rootScope;
            scope = rootScope.$new();

            rootScope.resourceBundle = {
                versionAndConnectionMessage: "{{praxis_version}} and {{dhis_url}}"
            };

            systemSettingRepository = new SystemSettingRepository();
            spyOn(systemSettingRepository, 'getDhisUrl').and.returnValue('someUrl');

            spyOn(chromeUtils, 'getPraxisVersion').and.returnValue('someVersion');

            controller = new FooterController(rootScope, scope, systemSettingRepository);
        }));

        describe('versionAndConnectionMessage', function() {
            it('should update the version and connection message when the locale changes', function() {
                systemSettingRepository.getDhisUrl.and.returnValue('dhisUrl');
                chromeUtils.getPraxisVersion.and.returnValue('praxisVersion');

                scope.$apply();

                expect(scope.versionAndConnectionMessage()).toEqual('praxisVersion and dhisUrl');

            });

            it('should not show version and connection message if dhisUrl is undefined', function () {
                systemSettingRepository.getDhisUrl.and.returnValue(undefined);

                scope.$apply();

                expect(scope.versionAndConnectionMessage()).toBeUndefined();
            });

            it('should not show version and connection message if resourceBundle is not loaded', function () {
                rootScope.resourceBundle = undefined;

                scope.$apply();

                expect(scope.versionAndConnectionMessage()).toBeUndefined();
            });
        });
    });
});