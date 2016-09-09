define(['pivotTableData', 'analyticsData'], function(PivotTableData, AnalyticsData) {
    describe('PivotTableData', function() {
        var pivotTableData, definition, data, mockAnalyticsData;

        beforeEach(function () {
            definition = {
                title: 'someTitle',
                dataSetCode: 'someDataSetCode',
                displayPosition: 'someDisplayPosition',
                weeklyReport: 'someBooleanValue',
                monthlyReport: 'anotherBooleanValue',
                sortAscending: 'sortAscendingBooleanValue',
                sortDescending: 'sortDescendingBooleanValue',
                sortable: 'sortableBooleanValue'
            };
            data = 'mockPivotTableData';
            mockAnalyticsData = {
                rows: [[{}]],
                columns: [['someColumn']],
                isDataAvailable: 'isDataAvailableBooleanValue',
                getDataValue: function() {},
                dataValuesExist: function() {},
                getTotalOfDataValues: function() {},
                getDisplayName: function() {}
            };
            spyOn(mockAnalyticsData, 'dataValuesExist').and.returnValue(true);
            spyOn(AnalyticsData, 'create').and.returnValue(mockAnalyticsData);
        });

        describe('create', function () {
            it('should create object with the required properties', function() {
                pivotTableData = PivotTableData.create(definition, data);

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

        describe('creation of AnalyticsData instance', function() {
            it('should map the properties and functions of the analytics data model', function () {
                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.columns).toEqual(mockAnalyticsData.columns);
                expect(pivotTableData.isDataAvailable).toEqual(mockAnalyticsData.isDataAvailable);
                expect(pivotTableData.getDataValue).toEqual(mockAnalyticsData.getDataValue);
                expect(pivotTableData.getTotalOfDataValues).toEqual(mockAnalyticsData.getTotalOfDataValues);
                expect(pivotTableData.getDisplayName).toEqual(mockAnalyticsData.getDisplayName);
            });

            it('should map the first row', function () {
                pivotTableData = PivotTableData.create(definition, data);
                expect(pivotTableData.rows).toEqual(_.first(mockAnalyticsData.rows));
            });

            it('should add rowNumber to the rows', function () {
                var expectedRow = [_.set({}, 'rowNumber', 1)];
                pivotTableData = PivotTableData.create(definition, data);
                expect(pivotTableData.rows).toEqual(expectedRow);
            });
        });

        describe('filtering of row and column items', function () {
            beforeEach(function () {
                mockAnalyticsData.dataValuesExist.and.callFake(function(item) {
                    return item.id == 'someRow';
                });
            });

            it('should filter out data dimension items without data', function () {
                mockAnalyticsData.rows = [[
                    { id: 'someRow', dataDimension: true },
                    { id: 'someOtherRow', dataDimension: true }
                ]];

                pivotTableData = PivotTableData.create(definition, data);
                expect(_.map(pivotTableData.rows, 'id')).toEqual(['someRow']);
            });

            it('should filter out orgUnits without data', function () {
                mockAnalyticsData.rows = [[
                    { id: 'someRow', orgUnitDimension: true },
                    { id: 'someOtherRow', orgUnitDimension: true }
                ]];

                pivotTableData = PivotTableData.create(definition, data);
                expect(_.map(pivotTableData.rows, 'id')).toEqual(['someRow']);
            });

            it('should filter out periods without data', function () {
                mockAnalyticsData.rows = [[
                    { id: 'someRow', periodDimension: true },
                    { id: 'someOtherRow', periodDimension: true }
                ]];

                pivotTableData = PivotTableData.create(definition, data);
                expect(_.map(pivotTableData.rows, 'id')).toEqual(['someRow']);
            });

            it('should not filter out category options without data', function () {
                mockAnalyticsData.rows = [[
                    { id: 'someRow', categoryDimension: true },
                    { id: 'someOtherRow', categoryDimension: true }
                ]];

                pivotTableData = PivotTableData.create(definition, data);
                expect(_.map(pivotTableData.rows, 'id')).toEqual(['someRow', 'someOtherRow']);
            });
        });

        describe('filtering of columns', function () {
            var column;

            beforeEach(function () {
                definition.geographicOriginReport = true;
                column = { id: 'someColumn', dataDimension: true };
                mockAnalyticsData.columns = [[column], [{ id: 'someOtherColumn' }, { id: 'yetAnotherColumn' }]];
            });

            it('should filter out columnConfigurations with only one item', function () {
                pivotTableData = PivotTableData.create(definition, data);
                expect(pivotTableData.columns.length).toEqual(1);
            });

            it('should not filter out columns if it is not a GeographicOrigin report', function () {
                definition.geographicOriginReport = false;
                pivotTableData = PivotTableData.create(definition, data);
                expect(pivotTableData.columns.length).toEqual(2);
            });

            it('should not filter out columns if they are not a data dimension', function () {
                column.dataDimension = false;
                pivotTableData = PivotTableData.create(definition, data);
                expect(pivotTableData.columns.length).toEqual(2);
            });
        });

        describe('columnConfigurations', function () {
            it('should map the cartesian product of the columns', function () {
                mockAnalyticsData.columns = [
                    [
                        { id: 'somePeriodId', dataValuesFilter: { pe: 'somePeriodId' } },
                        { id: 'someOtherPeriodId', dataValuesFilter: { pe: 'someOtherPeriodId' } }
                    ],[
                        { id: 'someCategoryOptionId', dataValuesFilter: { someCategoryId: 'someCategoryOptionId' } },
                        { id: 'someOtherCategoryOptionId', dataValuesFilter: { someCategoryId: 'someOtherCategoryOptionId' } }
                    ]
                ];
                pivotTableData = PivotTableData.create(definition, data);

                expect(_.last(pivotTableData.columnConfigurations)).toEqual([
                    {
                        id: 'someCategoryOptionId',
                        dataValuesFilter: {
                            pe: 'somePeriodId',
                            someCategoryId: 'someCategoryOptionId'
                        }
                    }, {
                        id: 'someOtherCategoryOptionId',
                        dataValuesFilter: {
                            pe: 'somePeriodId',
                            someCategoryId: 'someOtherCategoryOptionId'
                        }
                    }, {
                        id: 'someCategoryOptionId',
                        dataValuesFilter: {
                            pe: 'someOtherPeriodId',
                            someCategoryId: 'someCategoryOptionId'
                        }
                    }, {
                        id: 'someOtherCategoryOptionId',
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