define(['storageService', 'angularMocks', 'timecop', 'sjcl'], function (StorageService, mocks, timecop, sjcl) {
    describe('HistoryService', function () {
        var storageService, window;

        beforeEach(mocks.inject(function ($window) {

            Timecop.install();
            Timecop.freeze(new Date("2016-12-15T06:42:00.175Z"));

            window = {
                sessionStorage: {
                    setItem: jasmine.createSpy('setItem'),
                    getItem: jasmine.createSpy('getItem'),
                    removeItem: jasmine.createSpy('removeItem'),
                    clear: jasmine.createSpy('clear')
                }
            };

            spyOn(sjcl, 'encrypt');
            spyOn(sjcl, 'decrypt');

            storageService = new StorageService(window);
        }));

        afterEach(function () {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it('should set item in session storage', function () {
            sjcl.encrypt.and.returnValue('some encrypted string');

            storageService.setItem('someKey', {some: 'value'});

            expect(sjcl.encrypt).toHaveBeenCalledWith(
                'cc863e67ef04be6c629674388bdae7dd48fba292801e038e46a7859679384836',
                '{"some":"value"}'
            );

            expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
                'cc863e67ef04be6c629674388bdae7dd48fba292801e038e46a7859679384836',
                btoa('some encrypted string')
            );
        });

        describe('getItem', function () {
            var someValue;

            beforeEach(function () {
                someValue = btoa('some value');
                window.sessionStorage.getItem.and.returnValue(someValue);
            });

            it('should get item from session storage', function () {
                var storedObject = {
                    'hello': 'world'
                };

                sjcl.decrypt.and.returnValue(JSON.stringify(storedObject));

                var item = storageService.getItem('someKey');

                expect(window.sessionStorage.getItem).toHaveBeenCalledWith(
                    'cc863e67ef04be6c629674388bdae7dd48fba292801e038e46a7859679384836'
                );

                expect(sjcl.decrypt).toHaveBeenCalledWith(
                    'cc863e67ef04be6c629674388bdae7dd48fba292801e038e46a7859679384836',
                    atob(someValue)
                );

                expect(item).toEqual(storedObject);
            });

            it('should return null if the data is tampered', function () {
                sjcl.decrypt.and.returnValue('{ "some tampered json :');

                var item = storageService.getItem('someKey');

                expect(item).toBeNull();
            });
        });

        it('should clear the session storage', function () {
            storageService.clear();

            expect(window.sessionStorage.clear).toHaveBeenCalled();
        });

        it('should remove item from session storage', function () {
            storageService.removeItem('someKey');

            expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(
                'cc863e67ef04be6c629674388bdae7dd48fba292801e038e46a7859679384836'
            );
        });
    });
});