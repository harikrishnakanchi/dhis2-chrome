define(['footerController', 'systemSettingRepository', 'angularMocks'], function(FooterController, SystemSettingRepository, mocks) {
    describe('FooterController', function() {
        var controller, rootScope, scope,
            systemSettingRepository;

        beforeEach(mocks.inject(function($rootScope) {
            rootScope = $rootScope;
            scope = rootScope.$new();

            rootScope.resourceBundle = {
                connectionMessage: "{{dhis_url}}"
            };

            systemSettingRepository = new SystemSettingRepository();
            spyOn(systemSettingRepository, 'getDhisUrl').and.returnValue('someUrl');
            
            controller = new FooterController(rootScope, scope, systemSettingRepository);
        }));

        describe('connectionMessage', function() {
            it('should build the connection message', function() {
                systemSettingRepository.getDhisUrl.and.returnValue('dhisUrl');

                scope.$apply();

                expect(scope.connectionMessage()).toEqual('dhisUrl');

            });

            it('should not show connection message if dhisUrl is undefined', function () {
                systemSettingRepository.getDhisUrl.and.returnValue(undefined);

                scope.$apply();

                expect(scope.connectionMessage()).toBeUndefined();
            });

            it('should not show connection message if resourceBundle is not loaded', function () {
                rootScope.resourceBundle = undefined;

                scope.$apply();

                expect(scope.connectionMessage()).toBeUndefined();
            });
        });
    });
});