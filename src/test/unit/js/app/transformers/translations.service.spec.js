define(['translationsService', 'angularMocks', 'utils'], function (TranslationsService, mocks, utils) {
    describe('Translation Service', function () {
        var q, translationsService, mockDB, scope, mockStore;
        beforeEach(mocks.inject(function ($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;

            mockStore.each.and.callFake(function (query) {
                var result = [{
                    objectId: 'abc',
                    value: 'frenchName',
                    locale: 'fr'
                }, {
                    objectId: 'xyz',
                    value: 'frenchSection',
                    locale: 'fr'
                }, {
                    objectId: 'stu',
                    value: 'frenchDataElement',
                    locale: 'fr'
                }, {
                    objectId: 'ghi',
                    value: 'frenchGHISection',
                    locale: 'fr'
                }];
                return utils.getPromise(q, result);
            });
        }));

        it('should translate name to french if locale is french', function () {
            var locale = 'fr';
            var obj = {
                id: 'abc',
                name: 'testName'
            };

            translationsService = new TranslationsService(q, mockDB.db);
            translationsService.setLocale(locale);

            var actual;
            translationsService.translate(obj).then(function (data) {
                actual = data;
            });

            scope.$apply();

            expect(actual).toEqual({
                id: 'abc',
                name: 'frenchName'
            });
        });

        it('should not translate if locale is english', function () {
            var locale = 'en';
            var obj = {
                id: 'abc',
                name: 'testName'
            };

            translationsService = new TranslationsService(q, mockDB.db);
            translationsService.setLocale(locale);

            var actual;
            translationsService.translate(obj).then(function (data) {
                actual = data;
            });

            scope.$apply();

            expect(actual).toEqual({
                id: 'abc',
                name: 'testName'
            });
        });

        it('should translate the name in the nested object structure if locale is anything other than english', function () {
            var locale = 'fr';
            var obj = {
                id: 'abc',
                name: 'testName',
                sections: [{
                    id: 'xyz',
                    name: 'testSection',
                    dataElements: {
                        id: 'stu',
                        name: 'testDataElement'
                    }
                }, {
                    id: 'ghi',
                    name: 'testSection',
                    dataElements: {
                        id: 'stu',
                        name: 'testDataElement'
                    }
                }]
            };

            translationsService = new TranslationsService(q, mockDB.db);
            translationsService.setLocale(locale);

            var actual;
            translationsService.translate(obj).then(function (data) {
                actual = data;
            });

            scope.$apply();

            expect(actual).toEqual({
                id: 'abc',
                name: 'frenchName',
                sections: [{
                    id: 'xyz',
                    name: 'frenchSection',
                    dataElements: {
                        id: 'stu',
                        name: 'frenchDataElement'
                    }
                }, {
                    id: 'ghi',
                    name: 'frenchGHISection',
                    dataElements: {
                        id: 'stu',
                        name: 'frenchDataElement'
                    }
                }]
            });
        });

    });
});