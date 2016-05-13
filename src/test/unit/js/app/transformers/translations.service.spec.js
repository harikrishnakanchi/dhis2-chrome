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
                    objectId: 'id1',
                    value: 'frenchName',
                    locale: 'fr',
                    property: 'name'
                }, {
                    objectId: 'id2',
                    value: 'frenchSection',
                    locale: 'fr',
                    property: 'name'
                }, {
                    objectId: 'id3',
                    value: 'frenchDataElement',
                    locale: 'fr',
                    property: 'name'
                },{
                    objectId: 'id4',
                    value: 'french description',
                    locale: 'fr',
                    property: 'description'
                },{
                    objectId: 'id5',
                    value: 'frenchDataElementDescription',
                    locale: 'fr',
                    property: 'description'
                }, {
                    objectId: 'id4',
                    value: 'french name',
                    locale: 'fr',
                    property: 'name'
                }];
                return utils.getPromise(q, result);
            });
        }));

        it('should translate name to french if locale is french', function () {
            var locale = 'fr';
            var obj = {
                id: 'id1',
                name: 'testName'
            };

            translationsService = new TranslationsService(q, mockDB.db);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual;
            translationsService.translate(obj).then(function (data) {
                actual = data;
            });

            scope.$apply();

            expect(actual).toEqual({
                id: 'id1',
                name: 'frenchName'
            });
        });

        it('should not translate if locale is english', function () {
            var locale = 'en';
            var obj = {
                id: 'id1',
                name: 'testName'
            };

            translationsService = new TranslationsService(q, mockDB.db);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual;
            translationsService.translate(obj).then(function (data) {
                actual = data;
            });

            scope.$apply();

            expect(actual).toEqual({
                id: 'id1',
                name: 'testName'
            });
        });

        it('should translate the name in the nested object structure if locale is anything other than english', function () {
            var locale = 'fr';
            var obj = {
                id: 'id1',
                name: 'testName',
                sections: [{
                    id: 'id2',
                    name: 'testSection',
                    dataElements: {
                        id: 'id3',
                        name: 'testDataElement'
                    }
                }, {
                    id: 'id4',
                    name: 'testSection',
                    dataElements: {
                        id: 'id3',
                        name: 'testDataElement'
                    }
                }]
            };

            translationsService = new TranslationsService(q, mockDB.db);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual;
            translationsService.translate(obj).then(function (data) {
                actual = data;
            });

            scope.$apply();

            expect(actual).toEqual({
                id: 'id1',
                name: 'frenchName',
                sections: [{
                    id: 'id2',
                    name: 'frenchSection',
                    dataElements: {
                        id: 'id3',
                        name: 'frenchDataElement'
                    }
                }, {
                    id: 'id4',
                    name: 'french name',
                    dataElements: {
                        id: 'id3',
                        name: 'frenchDataElement'
                    }
                }]
            });
        });

        it('should set the default english name if there was no translation with the selected locale', function () {
            var locale = 'fr';
            var obj = {
                id: 'dhi',
                name: 'testName'
            };

            translationsService = new TranslationsService(q, mockDB.db);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual;
            translationsService.translate(obj).then(function (data) {
                actual = data;
            });

            scope.$apply();

            expect(actual).toEqual({
                id: 'dhi',
                name: 'testName'
            });
        });

        it('should translate description property in the object with the selected locale', function () {
            var locale = 'fr';
            var obj = {
                id: 'id4',
                description: 'english description'
            };

            translationsService = new TranslationsService(q, mockDB.db);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual;
            translationsService.translate(obj).then(function (data) {
                actual = data;
            });

            scope.$apply();

            expect(actual).toEqual({
                id: 'id4',
                description: 'french description'
            });
        });

        it('should translate name and description properties in the object with the selected locale', function () {
            var locale = 'fr';
            var obj = {
                id: 'id4',
                name: 'english name',
                description: 'english description'
            };

            translationsService = new TranslationsService(q, mockDB.db);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual;
            translationsService.translate(obj).then(function (data) {
                actual = data;
            });

            scope.$apply();

            expect(actual).toEqual({
                id: 'id4',
                name: 'french name',
                description: 'french description'
            });
        });

        it('should translate the description in the nested object structure if locale is anything other than english', function () {
            var locale = 'fr';
            var obj = {
                id: 'id1',
                name: 'testName',
                sections: [{
                    id: 'id2',
                    name: 'testSection',
                    dataElements: {
                        id: 'id3',
                        name: 'testDataElement'
                    }
                }, {
                    id: 'id4',
                    name: 'testSection',
                    dataElements: {
                        id: 'id5',
                        description: 'testDataElementDescription'
                    }
                }]
            };

            translationsService = new TranslationsService(q, mockDB.db);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual;
            translationsService.translate(obj).then(function (data) {
                actual = data;
            });

            scope.$apply();

            expect(actual).toEqual({
                id: 'id1',
                name: 'frenchName',
                sections: [{
                    id: 'id2',
                    name: 'frenchSection',
                    dataElements: {
                        id: 'id3',
                        name: 'frenchDataElement'
                    }
                }, {
                    id: 'id4',
                    name: 'french name',
                    dataElements: {
                        id: 'id5',
                        description: 'frenchDataElementDescription'
                    }
                }]
            });
        });
    });
});