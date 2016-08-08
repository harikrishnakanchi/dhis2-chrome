define(['pivotTableData'], function(PivotTableData) {
    describe('PivotTableData', function() {
        var pivotTableData, definition, data;

        beforeEach(function () {
            definition = {
                title: 'someTitle',
                dataSetCode: 'someDataSetCode',
                displayPosition: 'someDisplayPosition',
                dataDimensionItems: [{
                    dataElement: {
                        id: 'someDataElementId',
                        name: 'someDataElementName'
                    }
                }, {
                    indicator: {
                        id: 'someIndicatorId',
                        name: 'someIndicatorName'
                    }
                }]
            };
            data = {
                headers: [
                    { name: 'pe' },
                    { name: 'ou' },
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
                    ['somePeriod', 'someOrgUnitId', 'someValue']
                ]
            };
        });

        describe('create', function () {
            it('should create object with the required properties', function() {
                pivotTableData = PivotTableData.create(definition, {});

                expect(pivotTableData.title).toEqual(definition.title);
                expect(pivotTableData.dataSetCode).toEqual(definition.dataSetCode);
                expect(pivotTableData.displayPosition).toEqual(definition.displayPosition);
            });
        });

        describe('dataValues', function () {
            it('should map each data value to an object', function () {
                pivotTableData = PivotTableData.create({}, data);

                expect(pivotTableData.dataValues).toEqual([{
                    pe: 'somePeriod',
                    ou: 'someOrgUnitId',
                    value: 'someValue'
                }]);
            });
        });

        describe('rows', function () {
            it('should return an empty array if no row dimensions exist', function () {
                pivotTableData = PivotTableData.create({}, {});
                expect(pivotTableData.rows).toEqual([]);
            });

            it('should map the items to dataDimensionItems if dimension is dx', function () {
                definition.rows = [{
                    dimension: 'dx',
                    items: [
                        { id: 'someDataElementId' },
                        { id: 'someIndicatorId' }
                    ]
                }];
                pivotTableData = PivotTableData.create(definition, {});

                expect(pivotTableData.rows).toEqual([{
                    id: 'someDataElementId',
                    name: 'someDataElementName',
                    dimension: 'dx'
                }, {
                    id: 'someIndicatorId',
                    name: 'someIndicatorName',
                    dimension: 'dx'
                }]);
            });

            it('should map the items from metaData if dimension is ou', function () {
                definition.rows = [{
                    dimension: 'ou'
                }];
                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.rows).toEqual([{
                    id: 'someOrgUnitId',
                    name: 'someOrgUnitName',
                    dimension: 'ou'
                }, {
                    id: 'someOtherOrgUnitId',
                    name: 'someOtherOrgUnitName',
                    dimension: 'ou'
                }]);
            });

            it('should map the items from metaData if dimension is pe', function () {
                definition.rows = [{
                    dimension: 'pe'
                }];
                pivotTableData = PivotTableData.create(definition, data);

                expect(pivotTableData.rows).toEqual([{
                    id: 'somePeriodId',
                    name: 'somePeriodName',
                    dimension: 'pe'
                }, {
                    id: 'someOtherPeriodId',
                    name: 'someOtherPeriodName',
                    dimension: 'pe'
                }]);
            });
        });
    });
});