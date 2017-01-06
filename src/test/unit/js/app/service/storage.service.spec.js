define(['storageService', 'angularMocks', 'timecop', 'sjcl', 'moment'], function (StorageService, mocks, timecop, sjcl, moment) {
    describe('StorageService', function () {
        var storageService, window;

        beforeEach(mocks.inject(function () {

            Timecop.install();
            Timecop.freeze(moment('2017-01-06'));

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
                'e6165fd188a97403dee18391a974d94141f43f4d203f9a43f1473512d1ae1b28',
                '{"some":"value"}'
            );

            expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
                'e6165fd188a97403dee18391a974d94141f43f4d203f9a43f1473512d1ae1b28',
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
                    'e6165fd188a97403dee18391a974d94141f43f4d203f9a43f1473512d1ae1b28'
                );

                expect(sjcl.decrypt).toHaveBeenCalledWith(
                    'e6165fd188a97403dee18391a974d94141f43f4d203f9a43f1473512d1ae1b28',
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
                'e6165fd188a97403dee18391a974d94141f43f4d203f9a43f1473512d1ae1b28'
            );
        });
    });
});