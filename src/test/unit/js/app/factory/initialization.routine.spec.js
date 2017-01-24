define(['angularMocks', 'utils', 'initializationRoutine', 'packagedDataImporter', 'systemSettingRepository', 'translationsService', 'platformUtils'],
    function (mocks, utils, InitializationRoutine, PackagedDataImporter, SystemSettingRepository, TranslationsService, platformUtils) {
        var initializationRoutine, packagedDataImporter, q, location, rootScope, systemSettingRepository, translationsService;
        describe("InitializationRoutine", function () {
            beforeEach(mocks.inject(function ($q, $rootScope, $location) {
                q = $q;
                rootScope = $rootScope;
                location = $location;

                spyOn(location, 'path');
                spyOn(platformUtils, 'sendMessage');
                spyOn(platformUtils, 'init');

                packagedDataImporter = new PackagedDataImporter();
                spyOn(packagedDataImporter, 'run').and.returnValue(utils.getPromise(q, {}));

                translationsService = new TranslationsService();
                spyOn(translationsService, 'setLocale');

                systemSettingRepository = new SystemSettingRepository(undefined, q);
                spyOn(systemSettingRepository, 'getLocale').and.returnValue(utils.getPromise(q, 'SOME_LOCALE'));
                spyOn(systemSettingRepository, 'loadProductKey').and.returnValue(utils.getPromise(q, {}));

                initializationRoutine = InitializationRoutine(rootScope, location, systemSettingRepository, translationsService);
            }));

            describe('locale', function () {
                it("should get the locale from system setting repository and call setLocale on rootScope", function () {
                    spyOn(rootScope, 'setLocale');
                    initializationRoutine.run();

                    rootScope.$apply();

                    expect(systemSettingRepository.getLocale).toHaveBeenCalled();
                    expect(rootScope.setLocale).toHaveBeenCalledWith('SOME_LOCALE');
                });

                it("should set locale on rootScope", function () {
                    initializationRoutine.run();

                    rootScope.$apply();

                    expect(rootScope.locale).toEqual('SOME_LOCALE');
                });
            });

            describe('layoutDirection', function () {
                it("should set layoutDirection to rtl if language is arabic", function () {
                    systemSettingRepository.getLocale.and.returnValue(utils.getPromise(q, 'ar'));
                    initializationRoutine.run();

                    rootScope.$apply();

                    expect(rootScope.layoutDirection).toEqual({direction: 'rtl'});
                });

                it("should set layoutDirection to empty object if language is other than arabic", function () {
                    systemSettingRepository.getLocale.and.returnValue(utils.getPromise(q, 'NOT_ARABIC'));
                    initializationRoutine.run();

                    rootScope.$apply();

                    expect(rootScope.layoutDirection).toEqual({});
                });
            });

            describe('hasRoles', function () {
                beforeEach(function () {
                    rootScope.currentUser = {
                        userCredentials: {
                            userRoles: [
                                { name: 'Data entry user' }
                            ]
                        }
                    };
                    initializationRoutine.run();
                });

                it('should return false if currentUser is undefined', function () {
                    rootScope.currentUser = undefined;
                    rootScope.$apply();

                    expect(rootScope.hasRoles()).toBeFalsy();
                });

                it('should return false if currentUser role is not one of the allowed roles', function () {
                    rootScope.$apply();

                    var allowedRoles = ['Project Level Approver', 'Coordination Level Approver'];
                    expect(rootScope.hasRoles(allowedRoles)).toBeFalsy();
                });

                it('should return true if currentUser role is one of the allowed roles', function () {
                    rootScope.$apply();

                    var allowedRoles = ['Data entry user', 'Project Level Approver'];
                    expect(rootScope.hasRoles(allowedRoles)).toBeTruthy();
                });
            });

            it('should initialize platformUtils', function () {
                initializationRoutine.run();

                rootScope.$apply();

                expect(platformUtils.init).toHaveBeenCalled();
            });

            it('should load the product key', function () {
                initializationRoutine.run();

                rootScope.$apply();

                expect(systemSettingRepository.loadProductKey).toHaveBeenCalled();
            });
        });
    });
