define(['translationsService', 'angularMocks', 'utils', 'systemSettingRepository'], function (TranslationsService, mocks, utils, SystemSettingRepository) {
    describe('Translation Service', function () {
        var q, rootScope, translationsService, mockDB, scope, mockStore, i18nResourceBundle, systemSettingRepository, getResourceBundleSpy, mockedTranslations;
        beforeEach(mocks.inject(function ($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            rootScope = $rootScope;
            mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;

            i18nResourceBundle = {
                get: function() {}
            };

            getResourceBundleSpy = spyOn(i18nResourceBundle, "get");

            var frenchResourceBundle = {
                "data": {
                    "login": "french"
                }
            };
            getResourceBundleSpy.and.returnValue(utils.getPromise(q, frenchResourceBundle));

            rootScope.locale = 'fr';
            rootScope.$digest();

            systemSettingRepository = new SystemSettingRepository();
            spyOn(systemSettingRepository, 'upsertLocale').and.returnValue(utils.getPromise(q, {}));

            mockedTranslations = [{
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
                objectId: 'id4',
                value: 'frenchReport',
                locale: 'fr',
                property: 'shortName'
            }, {
                objectId: 'id4',
                value: 'french name',
                locale: 'fr',
                property: 'name'
            }, {
                objectId: 'id5',
                value: 'frenchDataElementDescription',
                locale: 'fr',
                property: 'description'
            }, {
                objectId: 'id6',
                value: 'frenchHeader',
                locale: 'fr',
                property: 'name'
            }];

            mockStore.each.and.callFake(function (query) {
                return utils.getPromise(q, mockedTranslations);
            });
        }));

        it('should translate name to french if locale is french', function () {
            var locale = 'fr';
            var obj = [{
                id: 'id1',
                name: 'testName'
            }];

            translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual = translationsService.translate(obj);

            expect(actual).toEqual([{
                id: 'id1',
                name: 'frenchName'
            }]);
        });

        it('should not translate if locale is english', function () {
            var locale = 'en';
            var obj = [{
                id: 'id1',
                name: 'testName'
            }];

            translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual = translationsService.translate(obj);

            expect(actual).toEqual([{
                id: 'id1',
                name: 'testName'
            }]);
        });

        it('should translate the name in the nested object structure if locale is anything other than english', function () {
            var locale = 'fr';
            var obj = [{
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
            }];

            translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual = translationsService.translate(obj);

            expect(actual).toEqual([{
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
            }]);
        });

        it('should set the default english name if there was no translation with the selected locale', function () {
            var locale = 'fr';
            var obj = [{
                id: 'dhi',
                name: 'testName'
            }];

            translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual = translationsService.translate(obj);

            expect(actual).toEqual([{
                id: 'dhi',
                name: 'testName'
            }]);
        });

        it('should translate description property in the object with the selected locale', function () {
            var locale = 'fr';
            var obj = [{
                id: 'id4',
                description: 'english description'
            }];

            translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual = translationsService.translate(obj);

            expect(actual).toEqual([{
                id: 'id4',
                description: 'french description'
            }]);
        });

        it('should translate name and description properties in the object with the selected locale', function () {
            var locale = 'fr';
            var obj = [{
                id: 'id4',
                name: 'english name',
                description: 'english description'
            }];

            translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual = translationsService.translate(obj);

            expect(actual).toEqual([{
                id: 'id4',
                name: 'french name',
                description: 'french description'
            }]);
        });

        it('should translate the description in the nested object structure if locale is anything other than english', function () {
            var locale = 'fr';
            var obj = [{
                id: 'id1',
                name: 'testName',
                sections: [{
                    id: 'id2',
                    name: 'testSection',
                    dataElements: {
                        id: 'id3',
                        name: 'testDataElement'
                    },
                    headers: [{
                        id: "id6",
                        name: "testHeader"
                    }]

                }, {
                    id: 'id4',
                    name: 'testSection',
                    dataElements: {
                        id: 'id5',
                        description: 'testDataElementDescription'
                    }
                }]
            }];

            translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual = translationsService.translate(obj);

            expect(actual).toEqual([{
                id: 'id1',
                name: 'frenchName',
                sections: [{
                    id: 'id2',
                    name: 'frenchSection',
                    dataElements: {
                        id: 'id3',
                        name: 'frenchDataElement'
                    },
                    headers: [{
                        id: "id6",
                        name: "frenchHeader"
                    }]

                }, {
                    id: 'id4',
                    name: 'french name',
                    dataElements: {
                        id: 'id5',
                        description: 'frenchDataElementDescription'
                    }
                }]
            }]);
        });

        it('should not translate dataElements for referral datasets if locale is anything other than english', function () {
            var locale = 'fr';
            var obj = [{
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
            }];

            translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
            translationsService.setLocale(locale);

            scope.$apply();

            var actual = translationsService.translateReferralLocations(obj);

            expect(actual).toEqual([{
                id: 'id1',
                name: 'frenchName',
                sections: [{
                    id: 'id2',
                    name: 'frenchSection',
                    dataElements: {
                        id: 'id3',
                        name: 'testDataElement'
                    }
                }, {
                    id: 'id4',
                    name: 'french name',
                    dataElements: {
                        id: 'id5',
                        description: 'testDataElementDescription'
                    }
                }]
            }]);
        });

        describe('translate reports', function () {
            var createMockReport = function () {
                return {
                    definition: {
                        rows: [{
                            items: [{
                                id: 'id4',
                                value: 'someName'
                            }]
                        }]
                    },
                    data: {
                        metaData: {
                            names: {}
                        }
                    }
                };
            };

            beforeEach(function () {
                var locale = 'fr';
                translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
                translationsService.setLocale(locale);
            });

            it('should translate the names for the rows in the reports', function () {
                var mockReport = createMockReport();

                scope.$apply();

                var translatedReport = translationsService.translateReports([mockReport]);
                expect(translatedReport[0].data.metaData.names).toEqual({id4: 'frenchReport'});
            });

            it('should translate the description of the item if translation exists', function () {
                var mockReport = createMockReport();
                mockReport.definition.rows[0].items[0].description = 'someDescription';

                scope.$apply();

                var translatedReport = translationsService.translateReports([mockReport]);
                expect(translatedReport[0].definition.rows[0].items[0].description).toEqual('french description');
            });
        });

        describe('translateCharts', function () {
            var locale, chartData;

            beforeEach(function () {
                var categoryOptionCombos = [{
                    name: '<23 months, Female',
                    id: 'categoryOptionComboId1',
                    categoryOptions: [
                        {id: 'categoryOptionId1', name: 'Female'},
                        {id: 'categoryOptionId2', name: '<23 months'}
                    ]
                }, {
                    name: '5-14 years',
                    id: 'categoryOptionComboId2',
                    categoryOptions: [
                        {id: 'categoryOptionId3', name: '5-14 years'}
                    ]
                }, {
                    name: '24-59 months, Male',
                    id: 'categoryOptionComboId3',
                    categoryOptions: [
                        {id: 'categoryOptionId4', name: 'Male'},
                        {id: 'categoryOptionId5', name: '24-59 months'}
                    ]
                }];

                var translations = [{
                    objectId: 'dataElementId',
                    value: 'french data element name',
                    locale: 'fr',
                    property: 'shortName'
                }, {
                    objectId: 'indicatorId',
                    value: 'french indicator name',
                    locale: 'fr',
                    property: 'shortName'
                }, {
                    objectId: 'categoryOptionId1',
                    value: 'Female fr',
                    locale: 'fr',
                    property: 'shortName'
                }, {
                    objectId: 'categoryOptionId2',
                    value: '<23 months fr',
                    locale: 'fr',
                    property: 'shortName'
                }, {
                    objectId: 'categoryOptionId3',
                    value: '5-14 years fr',
                    locale: 'fr',
                    property: 'shortName'
                }, {
                    objectId: 'categoryOptionId4',
                    value: 'Male fr',
                    locale: 'fr',
                    property: 'shortName'
                }];

                mockStore.getAll.and.returnValue(utils.getPromise(q, categoryOptionCombos));
                mockStore.each.and.returnValue(utils.getPromise(q, translations));

                locale = 'fr';

                translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
                translationsService.setLocale(locale);

                chartData = {
                    metaData: {
                        names: {
                            "dataElementId": "Some data element",
                            "indicatorId": "Some indicator",
                            "categoryOptionComboId1": "some category option data 1",
                            "categoryOptionComboId2": "some category option data 2",
                            "categoryOptionComboId3": "some category option data 3"
                        },
                        dx: ["dataElementId", "indicatorId"],
                        co: ["categoryOptionComboId1", "categoryOptionComboId2", "categoryOptionComboId3"]
                    }
                };
            });

            it('should translate dataelement, indicator and category option combo names in chart data', function () {
                scope.$apply();

                translationsService.translateCharts(chartData);

                expect(chartData.metaData.names.dataElementId).toEqual('french data element name');
                expect(chartData.metaData.names.indicatorId).toEqual('french indicator name');
            });

            it('should translate category option combo names in chart data', function () {
                scope.$apply();

                translationsService.translateCharts(chartData);

                expect(chartData.metaData.names.categoryOptionComboId1).toEqual('<23 months fr, Female fr');
                expect(chartData.metaData.names.categoryOptionComboId2).toEqual('5-14 years fr');
            });

            it('should translate return english category option combo name in chart data if one of the option is missing translation', function () {
                scope.$apply();

                translationsService.translateCharts(chartData);

                expect(chartData.metaData.names.categoryOptionComboId3).toEqual('some category option data 3');
            });
        });
    });
});
