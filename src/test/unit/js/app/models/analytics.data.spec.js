define(['analyticsData'], function (AnalyticsData) {
    describe('AnalyticsData', function() {
        var analyticsData, definition, data;

        beforeEach(function () {
            definition = {
                dataDimensionItems: [{
                    dataElement: {
                        id: 'someDataElementId',
                        name: 'someDataElementName',
                        description: 'someDataElementDescription'
                    }
                }, {
                    indicator: {
                        id: 'someIndicatorId',
                        name: 'someIndicatorName',
                        description: 'someIndicatorDescription'
                    }
                }, {
                    programIndicator: {
                        id: 'someProgramIndicatorId',
                        name: 'someProgramIndicatorName',
                        description: 'someProgramIndicatorDescription'
                    }
                }],
                categoryDimensions: [{
                    dataElementCategory: {
                        id: 'someCategoryId'
                    },
                    categoryOptions: [{
                        id: 'someCategoryOptionId',
                        name: 'someCategoryOptionName'
                    }, {
                        id: 'someOtherCategoryOptionId',
                        name: 'someOtherCategoryOptionName'
                    }]
                }]
            };
            data = {
                headers: [
                    { name: 'pe' },
                    { name: 'ou' },
                    { name: 'dx' },
                    { name: 'value' }
                ],
                metaData: {
                    ou: ['someOrgUnitId', 'someOtherOrgUnitId'],
                    pe: ['somePeriodId', 'someOtherPeriodId'],
                    names: {
                        someOrgUnitId: 'someOrgUnitName',
                        someOtherOrgUnitId: 'someOtherOrgUnitName',
                        somePeriodId: 'somePeriodName',
                        someOtherPeriodId: 'someOtherPeriodName'
                    }
                },
                rows: [
                    ['somePeriodId', 'someOrgUnitId', 'someDataElementId', '1.0'],
                    ['someOtherPeriodId', 'someOtherOrgUnitId', 'someIndicatorId', '1.0']
                ]
            };
        });
        
        describe('dataValues', function () {
            it('should map each data value to an object', function () {
                analyticsData = AnalyticsData.create({}, data);
        
                expect(analyticsData.dataValues).toEqual([{
                    pe: 'somePeriodId',
                    ou: 'someOrgUnitId',
                    dx: 'someDataElementId',
                    value: 1
                }, {
                    pe: 'someOtherPeriodId',
                    ou: 'someOtherOrgUnitId',
                    dx: 'someIndicatorId',
                    value: 1
                }]);
            });
        });
        
        describe('getDataValue', function () {
            it('should return the data value for the given row and column', function () {
                var row = {
                    dataValuesFilter: { pe: 'somePeriodId' }
                },  column = {
                    dataValuesFilter: { ou: 'someOrgUnitId' }
                };
        
                analyticsData = AnalyticsData.create(definition, data);
                expect(analyticsData.getDataValue(row,column)).toEqual(1);
            });
        });

        describe('dataValuesExist', function () {
            it('should return true if dimensionItem has corresponding dataValues', function () {
                var dimensionItem = {
                    dataValuesFilter: { pe: 'somePeriodId' }
                };

                analyticsData = AnalyticsData.create(definition, data);
                expect(analyticsData.dataValuesExist(dimensionItem)).toEqual(true);
            });

            it('should return false if dimensionItem has no corresponding dataValues', function () {
                var dimensionItem = {
                    dataValuesFilter: { pe: 'somePeriodIdWithoutData' }
                };

                analyticsData = AnalyticsData.create(definition, data);
                expect(analyticsData.dataValuesExist(dimensionItem)).toEqual(false);
            });
        });

        describe('getTotalOfDataValues', function () {
            it('should return total of data values matching the given row and column', function () {
                var row = {
                    dataValuesFilter: { pe: 'somePeriodId' }
                },  column = {
                    dataValuesFilter: { ou: 'someOrgUnitId' }
                };
        
                analyticsData = AnalyticsData.create(definition, data);
        
                expect(analyticsData.getTotalOfDataValues(row,column)).toEqual(1);
            });

            it('should return null if there are no matching data values', function () {
                var row = {
                    dataValuesFilter: { pe: 'someInvalidPeriodId' }
                },  column = {
                    dataValuesFilter: { ou: 'someOrgUnitId' }
                };
        
                analyticsData = AnalyticsData.create(definition, data);
        
                expect(analyticsData.getTotalOfDataValues(row,column)).toBeNull();
            });

            it('should ignore data values that are that are excluded from totals', function () {
                var row = {
                    dataValuesFilter: { pe: 'somePeriodId' }
                },  column = {
                    dataValuesFilter: { ou: 'someOrgUnitId' }
                };
                definition = {
                    categoryDimensions: [{
                        dataElementCategory: {
                            id: 'someCategoryId'
                        },
                        categoryOptions: [{
                            id: 'someCategoryOptionId',
                            code: 'someCode_excludeFromTotal'
                        }, {
                            id: 'someOtherCategoryOptionId',
                            code: 'someOtherCode'
                        }]
                    }]
                };
                data = {
                    headers: [
                        { name: 'pe' },
                        { name: 'ou' },
                        { name: 'categoryId' },
                        { name: 'value' }
                    ],
                    rows: [
                        ['somePeriodId', 'someOrgUnitId', 'someCategoryOptionId', '1.0'],
                        ['somePeriodId', 'someOrgUnitId', 'someOtherCategoryOptionId', '2.0']
                    ]
                };
        
                analyticsData = AnalyticsData.create(definition, data);
        
                expect(analyticsData.getTotalOfDataValues(row,column)).toEqual(2);
            });
        
        });
        
        describe('getDisplayName', function () {
            var item;
        
            beforeEach(function () {
                analyticsData = AnalyticsData.create({}, {});
            });
        
            it('should use name if item is not a data dimension', function () {
                item = { name: 'someName' };
                expect(analyticsData.getDisplayName(item)).toEqual(item.name);
            });
        
            describe('item is a data dimension', function () {
                it('should use formName if its available', function () {
                    item = {
                        formName: 'someName',
                        dataDimension: true
                    };
                    expect(analyticsData.getDisplayName(item)).toEqual(item.formName);
                });
        
                it('should split the shortName by hyphen if formName is not available', function () {
                    item = {
                        shortName: 'someShortName - someOtherName - yetAnotherName',
                        dataDimension: true
                    };
                    expect(analyticsData.getDisplayName(item)).toEqual('someShortName');
                });
        
                it('should split the name by hyphen if formName and shortName is not available', function () {
                    item = {
                        name: 'someName - someOtherName - yetAnotherName',
                        dataDimension: true
                    };
                    expect(analyticsData.getDisplayName(item)).toEqual('someName');
                });
            });
        });
        
        describe('isDataAvailable', function () {
            it('should return true if data values exist', function() {
                data.rows = ['someDataValue'];
                analyticsData = AnalyticsData.create({}, data);
        
                expect(analyticsData.isDataAvailable).toEqual(true);
            });
        
            it('should return false if data values do not exist', function() {
                data.rows = [];
                analyticsData = AnalyticsData.create({}, data);
        
                expect(analyticsData.isDataAvailable).toEqual(false);
            });
        });
        
        describe('mapping of dimensions for rows and columns', function () {
            it('should map the items to dataDimensionItems if dimension is dx', function () {
                definition.rows = [{
                    dimension: 'dx',
                    items: [
                        { id: 'someDataElementId' },
                        { id: 'someIndicatorId' },
                        { id: 'someProgramIndicatorId' }
                    ]
                }];
                data.rows = [
                    ['somePeriodId', 'someOrgUnitId', 'someDataElementId', '1.0'],
                    ['somePeriodId', 'someOrgUnitId', 'someIndicatorId', '1.0'],
                    ['somePeriodId', 'someOrgUnitId', 'someProgramIndicatorId', '1.0']
                ];
        
                analyticsData = AnalyticsData.create(definition, data);
        
                expect(analyticsData.rows).toEqual([[{
                    id: 'someDataElementId',
                    name: 'someDataElementName',
                    description: 'someDataElementDescription',
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: 'someDataElementId'
                    }
                }, {
                    id: 'someIndicatorId',
                    name: 'someIndicatorName',
                    description: 'someIndicatorDescription',
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: 'someIndicatorId'
                    }
                }, {
                    id: 'someProgramIndicatorId',
                    name: 'someProgramIndicatorName',
                    description: 'someProgramIndicatorDescription',
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: 'someProgramIndicatorId'
                    }
                }]]);
            });
        
            it('should retain the item name if there are no dataDimensionItems', function () {
                definition = {
                    dataDimensionItems: [],
                    rows: [{
                        dimension: 'dx',
                        items: [
                            { id: 'someDataElementId', name: 'someDataElementName' }
                        ]
                    }]
                };
                analyticsData = AnalyticsData.create(definition, data);
        
                expect(analyticsData.rows).toEqual([[{
                    id: 'someDataElementId',
                    name: 'someDataElementName',
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: 'someDataElementId'
                    }
                }]]);
            });
        
            it('should map the items from metaData if dimension is ou', function () {
                definition.rows = [{
                    dimension: 'ou'
                }];
                analyticsData = AnalyticsData.create(definition, data);
        
                expect(analyticsData.rows).toEqual([[{
                    id: 'someOrgUnitId',
                    name: 'someOrgUnitName',
                    orgUnitDimension: true,
                    dataValuesFilter: {
                        ou: 'someOrgUnitId'
                    }
                }, {
                    id: 'someOtherOrgUnitId',
                    name: 'someOtherOrgUnitName',
                    orgUnitDimension: true,
                    dataValuesFilter: {
                        ou: 'someOtherOrgUnitId'
                    }
                }]]);
            });
        
            it('should sort the items by name if dimension is ou', function () {
                definition.rows = [{
                    dimension: 'ou'
                }];
                data.metaData.names = {
                    someOrgUnitId: 'orgUnitBName',
                    someOtherOrgUnitId: 'orgUnitAName'
                };
        
                analyticsData = AnalyticsData.create(definition, data);
        
                expect(_.map(_.first(analyticsData.rows), 'name')).toEqual(['orgUnitAName', 'orgUnitBName']);
            });
        
            it('should sort the Not Specified orgUnit last if dimension is ou', function () {
                definition.rows = [{
                    dimension: 'ou'
                }];
                data.metaData.names = {
                    someOrgUnitId: 'Not Specified',
                    someOtherOrgUnitId: 'Zebra Town'
                };
        
                analyticsData = AnalyticsData.create(definition, data);
        
                expect(_.map(_.first(analyticsData.rows), 'name')).toEqual(['Zebra Town', 'Not Specified']);
            });
        
            it('should map the items from metaData if dimension is pe', function () {
                definition.rows = [{
                    dimension: 'pe'
                }];
                analyticsData = AnalyticsData.create(definition, data);
        
                expect(analyticsData.rows).toEqual([[{
                    id: 'somePeriodId',
                    name: 'somePeriodName',
                    periodDimension: true,
                    dataValuesFilter: {
                        pe: 'somePeriodId'
                    }
                }, {
                    id: 'someOtherPeriodId',
                    name: 'someOtherPeriodName',
                    periodDimension: true,
                    dataValuesFilter: {
                        pe: 'someOtherPeriodId'
                    }
                }]]);
            });
        
            it('should map the items from categoryDimensions if dimension is a category', function () {
                definition.rows = [{
                    dimension: 'someCategoryId',
                    items: [
                        { id: 'someCategoryOptionId' },
                        { id: 'someOtherCategoryOptionId' }
                    ]
                }];
        
                analyticsData = AnalyticsData.create(definition, data);
        
                expect(analyticsData.rows).toEqual([[{
                    id: 'someCategoryOptionId',
                    name: 'someCategoryOptionName',
                    categoryDimension: true,
                    dataValuesFilter: {
                        someCategoryId: 'someCategoryOptionId'
                    }
                }, {
                    id: 'someOtherCategoryOptionId',
                    name: 'someOtherCategoryOptionName',
                    categoryDimension: true,
                    dataValuesFilter: {
                        someCategoryId: 'someOtherCategoryOptionId'
                    }
                }]]);
            });
        });
        
        describe('rows', function () {
            it('should return an empty array if no row dimensions exist', function () {
                analyticsData = AnalyticsData.create({}, {});
                expect(analyticsData.rows).toEqual([]);
            });
        });
        
        describe('columns', function () {
            it('should return an empty array if no column dimensions exist', function () {
                analyticsData = AnalyticsData.create({}, {});
                expect(analyticsData.columns).toEqual([]);
            });
        });
    });
});