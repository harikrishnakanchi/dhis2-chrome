define(['translationsService', 'angularMocks', 'utils', 'systemSettingRepository'], function (TranslationsService, mocks, utils, SystemSettingRepository) {
    describe('Translation Service', function () {
        var q, rootScope, translationsService, mockDB, scope, mockStore, i18nResourceBundle, systemSettingRepository, mockTranslations;
        var ENGLISH = 'en', FRENCH = FRENCH;

        beforeEach(mocks.inject(function ($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            rootScope = $rootScope;
            mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;

            i18nResourceBundle = {
                get: function() {}
            };
            spyOn(i18nResourceBundle, 'get').and.returnValue(utils.getPromise(q, {}));

            systemSettingRepository = new SystemSettingRepository();
            spyOn(systemSettingRepository, 'upsertLocale').and.returnValue(utils.getPromise(q, {}));

            mockTranslations = [{
                objectId: 'id1',
                value: 'frenchName',
                locale: FRENCH,
                property: 'name'
            }, {
                objectId: 'id2',
                value: 'frenchSection',
                locale: FRENCH,
                property: 'name'
            }, {
                objectId: 'id3',
                value: 'frenchDataElement',
                locale: FRENCH,
                property: 'name'
            },{
                objectId: 'id4',
                value: 'french description',
                locale: FRENCH,
                property: 'description'
            },{
                objectId: 'id4',
                value: 'frenchReport',
                locale: FRENCH,
                property: 'shortName'
            }, {
                objectId: 'id4',
                value: 'french name',
                locale: FRENCH,
                property: 'name'
            }, {
                objectId: 'id5',
                value: 'frenchDataElementDescription',
                locale: FRENCH,
                property: 'description'
            }, {
                objectId: 'id6',
                value: 'frenchHeader',
                locale: FRENCH,
                property: 'name'
            }, {
                objectId: 'someRowId',
                value: 'frenchRowName',
                locale: FRENCH,
                property: 'name'
            }, {
                objectId: 'someColumnId',
                value: 'frenchColumnName',
                locale: FRENCH,
                property: 'name'
            }];
            mockStore.each.and.returnValue(utils.getPromise(q, mockTranslations));

            translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
        }));

        var initialiseTranslationsServiceForLocale = function (locale) {
            translationsService.setLocale(locale);
            scope.$apply();
        };

        it('should return translation value of property for specified object', function() {
            initialiseTranslationsServiceForLocale(FRENCH);
            expect(translationsService.getTranslationForProperty('id1', 'name')).toEqual('frenchName');
        });

        it('should return default value if translation for specified property in specified object is not present', function() {
            var defaultValue = "defaultValue";

            initialiseTranslationsServiceForLocale(FRENCH);
            expect(translationsService.getTranslationForProperty('id1', 'formName', defaultValue)).toEqual(defaultValue);
        });

        it('should translate name to french if locale is french', function () {
            var object = {
                id: 'id1',
                name: 'testName'
            };
            initialiseTranslationsServiceForLocale(FRENCH);
            expect(translationsService.translate(object).name).toEqual('frenchName');
        });
        
        it('should translate each element if object is an array', function () {
            var array = [{
                id: 'id1',
                name: 'testName'
            }, {
                id: 'id2',
                name: 'testName'
            }];
            initialiseTranslationsServiceForLocale(FRENCH);
            expect(_.map(translationsService.translate(array), 'name')).toEqual(['frenchName', 'frenchSection']);
        });

        it('should return undefined if object to be translated is undefined', function() {
            expect(translationsService.translate(undefined)).toBeUndefined();
        });

        it('should not translate if locale is english', function () {
            var obj = {
                id: 'id1',
                name: 'testName'
            };
            initialiseTranslationsServiceForLocale(ENGLISH);

            expect(translationsService.translate(obj).name).toEqual('testName');
        });

        it('should translate the name in the nested object structure if locale is anything other than english', function () {
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

            initialiseTranslationsServiceForLocale(FRENCH);

            var translatedObject = translationsService.translate(obj);
            expect(_.map(translatedObject.sections, 'name')).toEqual(['frenchSection', 'french name']);
        });

        it('should set the default english name if there was no translation with the selected locale', function () {
            var object = {
                id: 'someObjectIdWithoutTranslation',
                name: 'testName'
            };
            initialiseTranslationsServiceForLocale(FRENCH);

            expect(translationsService.translate(object).name).toEqual('testName');
        });

        it('should translate description property in the object with the selected locale', function () {
            var obj = {
                id: 'id4',
                description: 'english description'
            };
            initialiseTranslationsServiceForLocale(FRENCH);

            expect(translationsService.translate(obj).description).toEqual('french description');
        });

        it('should not translate dataElements for referral datasets if locale is anything other than english', function () {
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
            initialiseTranslationsServiceForLocale(FRENCH);

            expect(translationsService.translateReferralLocations(obj)).toEqual([{
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

        describe('translateChartData', function () {
            it('should translate the series and categories of the chartData', function () {
                var seriesItem = {
                    id: 'someRowId',
                    name: 'someRowName'
                },  categoryItem = {
                    id: 'someColumnId',
                    name: 'someColumnName'
                },  mockChartData = {
                    categories: [seriesItem],
                    series: [categoryItem]
                };
                initialiseTranslationsServiceForLocale(FRENCH);

                var translatedObjects = translationsService.translateChartData([mockChartData]);
                expect(translatedObjects).toEqual([mockChartData]);
                expect(seriesItem.name).toEqual('frenchRowName');
                expect(categoryItem.name).toEqual('frenchColumnName');
            });
        });

        describe('translate pivotTableData', function () {
            var mockPivotTableData, rowItem, columnItem, columnConfigurationItem;

            beforeEach(function () {
                rowItem = {
                    id: 'someRowId',
                    name: 'someRowName'
                };
                columnItem = {
                    id: 'someColumnId',
                    name: 'someColumnName'
                };
                columnConfigurationItem = {
                    id: 'someColumnId',
                    name: 'someColumnName'
                };
                mockPivotTableData = {
                    rows: [rowItem],
                    columns: [
                        [columnItem]
                    ],
                    columnConfigurations: [
                        [columnConfigurationItem]
                    ]
                };

                initialiseTranslationsServiceForLocale(FRENCH);
            });

            it('should translate the rows and columns of the pivotTableData', function () {
                var translatedObject = translationsService.translatePivotTableData([mockPivotTableData]);
                expect(translatedObject).toEqual([mockPivotTableData]);
                expect(rowItem.name).toEqual('frenchRowName');
                expect(columnItem.name).toEqual('frenchColumnName');
                expect(columnConfigurationItem.name).toEqual('frenchColumnName');
            });

            describe('row or column is a period dimension', function () {
                beforeEach(function () {
                    rootScope.resourceBundle = {
                        August: 'AugustInFrench'
                    };
                });

                it('should translate the month name if pivotTable is a monthly report', function () {
                    rowItem.id = 'somePeriodId';
                    rowItem.name = 'August 2016';
                    rowItem.periodDimension = true;
                    mockPivotTableData.monthlyReport = true;

                    translationsService.translatePivotTableData([mockPivotTableData]);
                    expect(rowItem.name).toEqual('AugustInFrench 2016');
                });
            });
        });
    });
});
