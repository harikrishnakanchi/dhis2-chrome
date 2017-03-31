define(['angularMocks', 'utils', 'initializationRoutine', 'packagedDataImporter', 'systemSettingRepository', 'translationsService', 'platformUtils', 'hustleMonitor'],
    function (mocks, utils, InitializationRoutine, PackagedDataImporter, SystemSettingRepository, TranslationsService, platformUtils, HustleMonitor) {
        var initializationRoutine, packagedDataImporter, q, location, rootScope, systemSettingRepository, translationsService, hustleMonitor;
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

                hustleMonitor = new HustleMonitor();
                spyOn(hustleMonitor, 'checkHustleQueueCount').and.returnValue(utils.getPromise(q, undefined));

                initializationRoutine = InitializationRoutine(rootScope, location, systemSettingRepository, translationsService, hustleMonitor);
            }));

            describe('layoutDirection', function () {
                it("should set layoutDirection to rtl if language is arabic", function () {
                    rootScope.setLocale('ar');

                    rootScope.$apply();

                    expect(rootScope.locale).toEqual('ar');
                    expect(rootScope.layoutDirection).toEqual({direction: 'rtl'});
                });

                it("should set layoutDirection to empty object if language is other than arabic", function () {
                    rootScope.setLocale('NOT_ARABIC');

                    rootScope.$apply();

                    expect(rootScope.locale).toEqual('NOT_ARABIC');
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

            describe('run', function () {
                beforeEach(function () {
                    initializationRoutine.run();
                    rootScope.$apply();
                });

                it('should initialize platformUtils', function () {
                    expect(platformUtils.init).toHaveBeenCalled();
                });

                it('should load the product key', function () {
                    expect(systemSettingRepository.loadProductKey).toHaveBeenCalled();
                });

                it('should check the hustle queue count', function () {
                    expect(hustleMonitor.checkHustleQueueCount).toHaveBeenCalled();
                });
            });
        });
    });
