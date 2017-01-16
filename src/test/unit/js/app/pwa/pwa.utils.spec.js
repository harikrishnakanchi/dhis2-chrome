define(['utils', 'platformUtils', 'platformConfig', 'indexedDBLogger'], function (utils, pwaUtils, pwaConfig, indexedDBLogger) {
    describe('PWA Utils', function () {
        describe('Uninstall', function () {
            var serviceWorkerRegistrations = [{ unregister: jasmine.createSpy('unregister')}],
                cacheKeys = ['some cache key'],
                databaseNames = ['hustle', pwaConfig.praxis.dbName, pwaConfig.praxis.dbForLogs],
                hustleService, indexedDBService, angularDOMRoot;

            beforeEach(function () {
                spyOn(navigator.serviceWorker, 'getRegistrations').and.returnValue(Promise.resolve(serviceWorkerRegistrations));
                self.worker = {
                    terminate: jasmine.createSpy('terminate')
                };

                spyOn(window.caches, 'keys').and.returnValue(Promise.resolve(cacheKeys));
                spyOn(window.caches, 'delete').and.returnValue(Promise.resolve(true));

                spyOn(indexedDBLogger, 'closeDB');

                hustleService = { wipe: jasmine.createSpy('wipe') };
                indexedDBService = { closeDB: jasmine.createSpy('closeDB') };

                spyOn(document, 'getElementById').and.returnValue(angularDOMRoot);
                window.location.reload = jasmine.createSpy('reload');
                spyOn(angular, 'element').and.returnValue({
                    injector: function () {
                        return {
                            get: jasmine.createSpy('get').and.callFake(function (servicename) {
                                if(servicename == '$indexedDB') return indexedDBService;
                                if(servicename == '$hustle') return hustleService;
                            })
                        };
                    }
                });

                spyOn(window.indexedDB, 'deleteDatabase').and.callThrough();
                spyOn(window.sessionStorage, 'clear');

                window.location.reload = jasmine.createSpy('reload');
            });

            it('should clear the service worker cache', function (done) {
                pwaUtils.uninstall().then(function () {
                    expect(window.caches.keys).toHaveBeenCalled();
                    expect(window.caches.delete.calls.argsFor(0)[0]).toEqual(cacheKeys[0]);

                    done();
                });
            });

            it('should unregister service worker', function (done) {
                pwaUtils.uninstall().then(function () {
                    expect(serviceWorkerRegistrations[0].unregister).toHaveBeenCalled();

                    done();
                });
            });

            it('should terminate web worker', function (done) {
                pwaUtils.uninstall().then(function () {
                    expect(self.worker.terminate).toHaveBeenCalled();

                    done();
                });
            });

            it('should delete all databases in indexedDB', function (done) {
                pwaUtils.uninstall().then(function () {
                    expect(indexedDBLogger.closeDB).toHaveBeenCalled();

                    expect(document.getElementById).toHaveBeenCalledWith('praxis');
                    expect(angular.element).toHaveBeenCalledWith(angularDOMRoot);

                    expect(hustleService.wipe).toHaveBeenCalled();
                    expect(indexedDBService.closeDB).toHaveBeenCalled();

                    expect(window.indexedDB.deleteDatabase.calls.argsFor(0)[0]).toEqual(databaseNames[0]);
                    expect(window.indexedDB.deleteDatabase.calls.argsFor(1)[0]).toEqual(databaseNames[1]);
                    expect(window.indexedDB.deleteDatabase.calls.argsFor(2)[0]).toEqual(databaseNames[2]);

                    done();
                });
            });

            it('should clear the session storage', function (done) {
                pwaUtils.uninstall().then(function () {
                    expect(window.sessionStorage.clear).toHaveBeenCalled();

                    done();
                });
            });
        });
    });
});
