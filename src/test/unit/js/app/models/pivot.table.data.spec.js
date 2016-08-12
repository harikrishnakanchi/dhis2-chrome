define(['pivotTableData'], function(PivotTableData) {
    describe('PivotTableData', function() {
        var pivotTableData, definition, data;

        beforeEach(function () {
            definition = {
                title: 'someTitle',
                dataSetCode: 'someDataSetCode',
                displayPosition: 'someDisplayPosition',
                weeklyReport: 'someBooleanValue',
                monthlyReport: 'anotherBooleanValue',
                sortAscending: 'sortAscendingBooleanValue',
                sortDescending: 'sortDescendingBooleanValue',
                sortable: 'sortableBooleanValue',
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

        describe('create', function () {
            it('should create object with the required properties', function() {
                pivotTableData = PivotTableData.create(definition, {});

                expect(pivotTableData.title).toEqual(definition.title);
                expect(pivotTableData.dataSetCode).toEqual(definition.dataSetCode);
                expect(pivotTableData.displayPosition).toEqual(definition.displayPosition);
                expect(pivotTableData.weeklyReport).toEqual(definition.weeklyReport);
                expect(pivotTableData.monthlyReport).toEqual(definition.monthlyReport);
                expect(pivotTableData.sortAscending).toEqual(definition.sortAscending);
                expect(pivotTableData.sortDescending).toEqual(definition.sortDescending);
                expect(pivotTableData.sortable).toEqual(definition.sortable);
            });
        });

        describe('dataValues', function () {
            it('should map each data value to an object', function () {
                pivotTableData = PivotTableData.create({}, data);

                expect(pivotTableData.dataValues).toEqual([{
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

                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.getDataValue(row,column)).toEqual(1);
            });
        });

        describe('getTotalOfDataValues', function () {
            it('should return total of data values matching the given row and column', function () {
                var row = {
                    dataValuesFilter: { pe: 'somePeriodId' }
                },  column = {
                    dataValuesFilter: { ou: 'someOrgUnitId' }
                };

                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.getTotalOfDataValues(row,column)).toEqual(1);
            });

            it('should return null if there are no matching data values', function () {
                var row = {
                    dataValuesFilter: { pe: 'someInvalidPeriodId' }
                },  column = {
                    dataValuesFilter: { ou: 'someOrgUnitId' }
                };

                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.getTotalOfDataValues(row,column)).toBeNull();
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

                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.getTotalOfDataValues(row,column)).toEqual(2);
            });

        });

        describe('getDisplayName', function () {
            var pivotTableData, item;

            beforeEach(function () {
                pivotTableData = PivotTableData.create({}, {});
            });

            it('should use name if item is not a data dimension', function () {
                item = { name: 'someName' };
                expect(pivotTableData.getDisplayName(item)).toEqual(item.name);
            });

            describe('item is a data dimension', function () {
                it('should use formName if its available', function () {
                    item = {
                        formName: 'someName',
                        dataDimension: true
                    };
                    expect(pivotTableData.getDisplayName(item)).toEqual(item.formName);
                });

                it('should split the shortName by hyphen if formName is not available', function () {
                    item = {
                        shortName: 'someShortName - someOtherName - yetAnotherName',
                        dataDimension: true
                    };
                    expect(pivotTableData.getDisplayName(item)).toEqual('someShortName');
                });

                it('should split the name by hyphen if formName and shortName is not available', function () {
                    item = {
                        name: 'someName - someOtherName - yetAnotherName',
                        dataDimension: true
                    };
                    expect(pivotTableData.getDisplayName(item)).toEqual('someName');
                });
            });
        });

        describe('isTableDataAvailable', function () {
            it('should return true if data values exist', function() {
                data.rows = ['someDataValue'];
                pivotTableData = PivotTableData.create({}, data);

                expect(pivotTableData.isTableDataAvailable).toEqual(true);
            });

            it('should return false if data values do not exist', function() {
                data.rows = [];
                pivotTableData = PivotTableData.create({}, data);

                expect(pivotTableData.isTableDataAvailable).toEqual(false);
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

                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.rows).toEqual([{
                    rowNumber: 1,
                    id: 'someDataElementId',
                    name: 'someDataElementName',
                    description: 'someDataElementDescription',
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: 'someDataElementId'
                    }
                }, {
                    rowNumber: 2,
                    id: 'someIndicatorId',
                    name: 'someIndicatorName',
                    description: 'someIndicatorDescription',
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: 'someIndicatorId'
                    }
                }, {
                    rowNumber: 3,
                    id: 'someProgramIndicatorId',
                    name: 'someProgramIndicatorName',
                    description: 'someProgramIndicatorDescription',
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: 'someProgramIndicatorId'
                    }
                }]);
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
                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.rows).toEqual([{
                    rowNumber: 1,
                    id: 'someDataElementId',
                    name: 'someDataElementName',
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: 'someDataElementId'
                    }
                }]);
            });

            it('should filter out data dimension items without data', function () {
                definition.rows = [{
                    dimension: 'dx',
                    items: [
                        { id: 'someDataElementId' },
                        { id: 'someIndicatorId' }
                    ]
                }];
                data.rows = [
                    ['somePeriodId', 'someOrgUnitId', 'someDataElementId', '1.0']
                ];

                pivotTableData = PivotTableData.create(definition, data);

                expect(_.map(pivotTableData.rows, 'id')).toEqual(['someDataElementId']);
            });

            it('should map the items from metaData if dimension is ou', function () {
                definition.rows = [{
                    dimension: 'ou'
                }];
                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.rows).toEqual([{
                    rowNumber: 1,
                    id: 'someOrgUnitId',
                    name: 'someOrgUnitName',
                    orgUnitDimension: true,
                    dataValuesFilter: {
                        ou: 'someOrgUnitId'
                    }
                }, {
                    rowNumber: 2,
                    id: 'someOtherOrgUnitId',
                    name: 'someOtherOrgUnitName',
                    orgUnitDimension: true,
                    dataValuesFilter: {
                        ou: 'someOtherOrgUnitId'
                    }
                }]);
            });

            it('should filter out orgUnits without data', function () {
                definition.rows = [{
                    dimension: 'ou'
                }];
                data.rows = [
                    ['somePeriodId', 'someOrgUnitId', 'someDataElementId', '1.0']
                ];

                pivotTableData = PivotTableData.create(definition, data);

                expect(_.map(pivotTableData.rows, 'id')).toEqual(['someOrgUnitId']);
            });

            it('should map the items from metaData if dimension is pe', function () {
                definition.rows = [{
                    dimension: 'pe'
                }];
                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.rows).toEqual([{
                    rowNumber: 1,
                    id: 'somePeriodId',
                    name: 'somePeriodName',
                    periodDimension: true,
                    dataValuesFilter: {
                        pe: 'somePeriodId'
                    }
                }, {
                    rowNumber: 2,
                    id: 'someOtherPeriodId',
                    name: 'someOtherPeriodName',
                    periodDimension: true,
                    dataValuesFilter: {
                        pe: 'someOtherPeriodId'
                    }
                }]);
            });

            it('should filter out periods without data', function () {
                definition.rows = [{
                    dimension: 'pe'
                }];
                data.rows = [
                    ['somePeriodId', 'someOrgUnitId', 'someDataElementId', '1.0']
                ];

                pivotTableData = PivotTableData.create(definition, data);

                expect(_.map(pivotTableData.rows, 'id')).toEqual(['somePeriodId']);
            });

            it('should map the items from categoryDimensions if dimension is a category', function () {
                definition.rows = [{
                    dimension: 'someCategoryId',
                    items: [
                        { id: 'someCategoryOptionId' },
                        { id: 'someOtherCategoryOptionId' }
                    ]
                }];

                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.rows).toEqual([{
                    rowNumber: 1,
                    id: 'someCategoryOptionId',
                    name: 'someCategoryOptionName',
                    categoryDimension: true,
                    dataValuesFilter: {
                        someCategoryId: 'someCategoryOptionId'
                    }
                }, {
                    rowNumber: 2,
                    id: 'someOtherCategoryOptionId',
                    name: 'someOtherCategoryOptionName',
                    categoryDimension: true,
                    dataValuesFilter: {
                        someCategoryId: 'someOtherCategoryOptionId'
                    }
                }]);
            });
        });

        describe('rows', function () {
            it('should return an empty array if no row dimensions exist', function () {
                pivotTableData = PivotTableData.create({}, {});
                expect(pivotTableData.rows).toEqual([]);
            });

        });

        describe('columns', function () {
            it('should return an empty array if no column dimensions exist', function () {
                pivotTableData = PivotTableData.create({}, {});
                expect(pivotTableData.columns).toEqual([]);
            });
        });

        describe('columnConfigurations', function () {
            it('should map the cartesian product of the columns', function () {
                definition.columns = [{
                    dimension: 'pe'
                }, {
                    dimension: 'someCategoryId',
                    items: [
                        { id: 'someCategoryOptionId' },
                        { id: 'someOtherCategoryOptionId' }
                    ]
                }];

                pivotTableData = PivotTableData.create(definition, data);

                expect(_.last(pivotTableData.columnConfigurations)).toEqual([
                    {
                        id: 'someCategoryOptionId',
                        name: 'someCategoryOptionName',
                        categoryDimension: true,
                        dataValuesFilter: {
                            pe: 'somePeriodId',
                            someCategoryId: 'someCategoryOptionId'
                        }
                    }, {
                        id: 'someOtherCategoryOptionId',
                        name: 'someOtherCategoryOptionName',
                        categoryDimension: true,
                        dataValuesFilter: {
                            pe: 'somePeriodId',
                            someCategoryId: 'someOtherCategoryOptionId'
                        }
                    }, {
                        id: 'someCategoryOptionId',
                        name: 'someCategoryOptionName',
                        categoryDimension: true,
                        dataValuesFilter: {
                            pe: 'someOtherPeriodId',
                            someCategoryId: 'someCategoryOptionId'
                        }
                    }, {
                        id: 'someOtherCategoryOptionId',
                        name: 'someOtherCategoryOptionName',
                        categoryDimension: true,
                        dataValuesFilter: {
                            pe: 'someOtherPeriodId',
                            someCategoryId: 'someOtherCategoryOptionId'
                        }
                    }
                ]);
            });
        });
    });
});