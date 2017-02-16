define(['translationsService', 'angularMocks', 'utils', 'systemSettingRepository'], function (TranslationsService, mocks, utils, SystemSettingRepository) {
    describe('Translation Service', function () {
        var q, rootScope, translationsService, mockDB, scope, mockStore, i18nResourceBundle, systemSettingRepository, mockTranslations;
        var ENGLISH = 'en', FRENCH = 'fr';

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
                objectId: 'someIdA',
                value: 'someFrenchNameA',
                locale: FRENCH,
                property: 'name'
            }, {
                objectId: 'someIdB',
                value: 'someFrenchNameB',
                locale: FRENCH,
                property: 'name'
            }, {
                objectId: 'someIdC',
                value: 'someFrenchNameC',
                locale: FRENCH,
                property: 'name'
            },{
                objectId: 'someIdD',
                value: 'someFrenchDescriptionD',
                locale: FRENCH,
                property: 'description'
            }];
            mockStore.each.and.returnValue(utils.getPromise(q, mockTranslations));

            translationsService = new TranslationsService(q, mockDB.db, rootScope, i18nResourceBundle, systemSettingRepository);
        }));

        var initialiseTranslationsServiceForLocale = function (locale) {
            translationsService.setLocale(locale);
            scope.$apply();
        };

        it('should return translation value of property for specified object', function () {
            initialiseTranslationsServiceForLocale(FRENCH);
            expect(translationsService.getTranslationForProperty({'id': 'someIdA'}, 'name')).toEqual('someFrenchNameA');
        });

        it('should return default value if translation for specified property in specified object is not present', function() {
            initialiseTranslationsServiceForLocale(FRENCH);
            expect(translationsService.getTranslationForProperty('someInvalidId', 'name', 'defaultValue')).toEqual('defaultValue');
        });

        it('should translate name to french if locale is french', function () {
            var object = {
                id: 'someIdA',
                name: 'someEnglishNameA'
            };
            initialiseTranslationsServiceForLocale(FRENCH);
            expect(translationsService.translate(object).name).toEqual('someFrenchNameA');
        });
        
        it('should translate each element if object is an array', function () {
            var array = [{
                id: 'someIdA',
                name: 'someEnglishNameA'
            }, {
                id: 'someIdB',
                name: 'someEnglishNameB'
            }];
            initialiseTranslationsServiceForLocale(FRENCH);
            expect(_.map(translationsService.translate(array), 'name')).toEqual(['someFrenchNameA', 'someFrenchNameB']);
        });

        it('should return undefined if object to be translated is undefined', function() {
            expect(translationsService.translate(undefined)).toBeUndefined();
        });

        it('should not translate if locale is english', function () {
            var obj = {
                id: 'someIdA',
                name: 'someEnglishNameA'
            };
            initialiseTranslationsServiceForLocale(ENGLISH);

            expect(translationsService.translate(obj).name).toEqual('someEnglishNameA');
        });

        it('should translate nested objects', function () {
            var obj = {
                id: 'someIdA',
                name: 'someEnglishNameA',
                sections: [{
                    id: 'someIdB',
                    name: 'someEnglishNameB'
                }, {
                    id: 'someIdC',
                    name: 'someEnglishNameC'
                }]
            };

            initialiseTranslationsServiceForLocale(FRENCH);

            var translatedObject = translationsService.translate(obj);
            expect(_.map(translatedObject.sections, 'name')).toEqual(['someFrenchNameB', 'someFrenchNameC']);
        });

        it('should keep the default name if there was no translation with the selected locale', function () {
            var object = {
                id: 'someInvalidId',
                name: 'someEnglishName'
            };
            initialiseTranslationsServiceForLocale(FRENCH);

            expect(translationsService.translate(object).name).toEqual('someEnglishName');
        });

        it('should get translation from object when translations are part of the object', function () {
            var obj = {
                id: 'randomId',
                name: 'someName',
                translations: [
                    {
                        'property': 'NAME',
                        'locale': 'ar',
                        'value': 'Arabic name'
                    },
                    {
                        'property': 'NAME',
                        'locale': 'fr',
                        'value': 'FrenchName'
                    }
                ]
            };
            initialiseTranslationsServiceForLocale(FRENCH);
            expect(translationsService.translate(obj).name).toEqual('FrenchName');
        });

        it('should translate the description property in the object', function () {
            var obj = {
                id: 'someIdD',
                description: 'someEnglishDescriptionD'
            };
            initialiseTranslationsServiceForLocale(FRENCH);

            expect(translationsService.translate(obj).description).toEqual('someFrenchDescriptionD');
        });

        it('should not translate dataElements for referral dataDets', function () {
            var obj = [{
                id: 'someIdA',
                name: 'someEnglishNameA',
                sections: [{
                    id: 'someIdB',
                    name: 'someEnglishNameB',
                    dataElements: {
                        id: 'someIdC',
                        name: 'someEnglishNameC'
                    }
                }]
            }];
            initialiseTranslationsServiceForLocale(FRENCH);

            expect(translationsService.translateReferralLocations(obj)).toEqual([{
                id: 'someIdA',
                name: 'someFrenchNameA',
                sections: [{
                    id: 'someIdB',
                    name: 'someFrenchNameB',
                    dataElements: {
                        id: 'someIdC',
                        name: 'someEnglishNameC'
                    }
                }]
            }]);
        });

        describe('translateChartData', function () {
            var seriesItem, categoryItem, mockChartData;

            beforeEach(function () {
                seriesItem = {
                    id: 'someIdA',
                    name: 'someEnglishNameA'
                };
                categoryItem = {
                    id: 'someIdB',
                    name: 'someEnglishNameB'
                };
                mockChartData = {
                    categories: [seriesItem],
                    series: [categoryItem]
                };
                initialiseTranslationsServiceForLocale(FRENCH);
            });

            it('should translate the series and categories of the chartData', function () {
                var translatedObjects = translationsService.translateChartData([mockChartData]);
                expect(translatedObjects).toEqual([mockChartData]);
                expect(seriesItem.name).toEqual('someFrenchNameA');
                expect(categoryItem.name).toEqual('someFrenchNameB');
            });

            describe('row or column is a period dimension', function () {
                beforeEach(function () {
                    rootScope.resourceBundle = {
                        August: 'AugustInFrench'
                    };
                    seriesItem.id = 'somePeriodId';
                    seriesItem.name = 'August 2016';
                    seriesItem.periodDimension = true;
                    mockChartData.monthlyChart = true;
                });

                it('should translate the month name if chart is a monthly chart', function () {
                    translationsService.translateChartData([mockChartData]);
                    expect(seriesItem.name).toEqual('AugustInFrench 2016');
                });
            });

        });

        describe('translate pivotTableData', function () {
            var mockPivotTableData, rowItem, columnItem, columnConfigurationItem;

            beforeEach(function () {
                rowItem = {
                    id: 'someIdA',
                    name: 'someEnglishNameA'
                };
                columnItem = {
                    id: 'someIdB',
                    name: 'someEnglishNameB'
                };
                columnConfigurationItem = {
                    id: 'someIdC',
                    name: 'someEnglishNameC'
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
                expect(rowItem.name).toEqual('someFrenchNameA');
                expect(columnItem.name).toEqual('someFrenchNameB');
                expect(columnConfigurationItem.name).toEqual('someFrenchNameC');
            });

            it('should not translate the rows of referralLocationReport', function () {
                mockPivotTableData.referralLocationReport = true;
                var translatedObject = translationsService.translatePivotTableData([mockPivotTableData]);
                expect(translatedObject).toEqual([mockPivotTableData]);
                expect(rowItem.name).toEqual('someEnglishNameA');
                expect(columnItem.name).toEqual('someFrenchNameB');
                expect(columnConfigurationItem.name).toEqual('someFrenchNameC');
            });

            describe('row or column is a period dimension', function () {
                beforeEach(function () {
                    rootScope.resourceBundle = {
                        August: 'AugustInFrench'
                    };
                    rowItem.id = 'somePeriodId';
                    rowItem.name = 'August 2016';
                    rowItem.periodDimension = true;
                    mockPivotTableData.monthlyReport = true;
                });

                it('should translate the month name if pivotTable is a monthly report', function () {
                    translationsService.translatePivotTableData([mockPivotTableData]);
                    expect(rowItem.name).toEqual('AugustInFrench 2016');
                });
            });
        });
    });
});
