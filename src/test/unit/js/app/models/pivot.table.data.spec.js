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
                    ['somePeriodId', 'someOrgUnitId', 'someDataElementId', 'someValue'],
                    ['someOtherPeriodId', 'someOtherOrgUnitId', 'someIndicatorId', 'someValue']
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
                    value: 'someValue'
                }, {
                    pe: 'someOtherPeriodId',
                    ou: 'someOtherOrgUnitId',
                    dx: 'someIndicatorId',
                    value: 'someValue'
                }]);
            });

            it('should mark the data values that are that are excluded from totals', function () {
                var categoryDimension = _.first(definition.categoryDimensions);
                categoryDimension.categoryOptions = [{
                    id: 'someCategoryOptionId',
                    name: 'someCategoryOptionName',
                    code: 'someCode_excludeFromTotal'
                }, {
                    id: 'someOtherCategoryOptionId',
                    name: 'someOtherCategoryOptionName',
                    code: 'someOtherCode'
                }];
                data = {
                    headers: [
                        { name: 'pe' },
                        { name: 'categoryId' },
                        { name: 'dx' },
                        { name: 'value' }
                    ],
                    rows: [
                        ['somePeriodId', 'someCategoryOptionId', 'someDataElementId', 'someValue'],
                        ['someOtherPeriodId', 'someOtherCategoryOptionId', 'someIndicatorId', 'someValue']
                    ]
                };

                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.dataValues).toEqual([{
                    pe: 'somePeriodId',
                    categoryId: 'someCategoryOptionId',
                    dx: 'someDataElementId',
                    value: 'someValue',
                    excludedFromTotals: true,
                }, {
                    pe: 'someOtherPeriodId',
                    categoryId: 'someOtherCategoryOptionId',
                    dx: 'someIndicatorId',
                    value: 'someValue'
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

                expect(pivotTableData.getDataValue(row,column)).toEqual('someValue');
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
                        { id: 'someIndicatorId' }
                    ]
                }];
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
                    ['somePeriodId', 'someOrgUnitId', 'someDataElementId', 'someValue']
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
                    dataValuesFilter: {
                        ou: 'someOrgUnitId'
                    }
                }, {
                    rowNumber: 2,
                    id: 'someOtherOrgUnitId',
                    name: 'someOtherOrgUnitName',
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
                    ['somePeriodId', 'someOrgUnitId', 'someDataElementId', 'someValue']
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
                    ['somePeriodId', 'someOrgUnitId', 'someDataElementId', 'someValue']
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
                    dataValuesFilter: {
                        someCategoryId: 'someCategoryOptionId'
                    }
                }, {
                    rowNumber: 2,
                    id: 'someOtherCategoryOptionId',
                    name: 'someOtherCategoryOptionName',
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

            it('should map the cartesian product if there are multiple columns', function () {
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

                expect(_.last(pivotTableData.columns)).toEqual([
                    {
                        id: 'someCategoryOptionId',
                        name: 'someCategoryOptionName',
                        dataValuesFilter: {
                            pe: 'somePeriodId',
                            someCategoryId: 'someCategoryOptionId'
                        }
                    }, {
                        id: 'someOtherCategoryOptionId',
                        name: 'someOtherCategoryOptionName',
                        dataValuesFilter: {
                            pe: 'somePeriodId',
                            someCategoryId: 'someOtherCategoryOptionId'
                        }
                    }, {
                        id: 'someCategoryOptionId',
                        name: 'someCategoryOptionName',
                        dataValuesFilter: {
                            pe: 'someOtherPeriodId',
                            someCategoryId: 'someCategoryOptionId'
                        }
                    }, {
                        id: 'someOtherCategoryOptionId',
                        name: 'someOtherCategoryOptionName',
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