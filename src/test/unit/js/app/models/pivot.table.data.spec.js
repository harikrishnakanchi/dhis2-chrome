define(['pivotTableData'], function(PivotTableData) {
    describe('PivotTableData', function() {
        var pivotTableData, definition, data;

        describe('create', function () {
            it('should create object with the required properties', function() {
                definition = {
                    title: 'someTitle',
                    dataSetCode: 'someDataSetCode',
                    displayPosition: 'someDisplayPosition'
                };
                pivotTableData = PivotTableData.create(definition, {});

                expect(pivotTableData.title).toEqual(definition.title);
                expect(pivotTableData.dataSetCode).toEqual(definition.dataSetCode);
                expect(pivotTableData.displayPosition).toEqual(definition.displayPosition);
            });
        });

        describe('dataValues', function () {
            it('should map each data value to an object', function () {
                data = {
                    headers: [
                        { name: 'pe' },
                        { name: 'ou' },
                        { name: 'value' }
                    ],
                    rows: [
                        ['somePeriod', 'someOrgUnitId', 'someValue']
                    ]
                };
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
                definition = {};
                pivotTableData = PivotTableData.create(definition, {});

                expect(pivotTableData.rows).toEqual([]);
            });

            it('should map the items to dataDimensionItems if dimension is dx', function () {
                definition = {
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
                    }],
                    rows: [{
                        dimension: 'dx',
                        items: [
                            { id: 'someDataElementId' },
                            { id: 'someIndicatorId' }
                        ]
                    }]
                };
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
                definition = {
                    rows: [{
                        dimension: 'ou'
                    }]
                };
                data = {
                    metaData: {
                        ou: ['someOrgUnitId', 'someOtherOrgUnitId'],
                        names: {
                            someOrgUnitId: 'someOrgUnitName',
                            someOtherOrgUnitId: 'someOtherOrgUnitName'
                        }
                    }
                };

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
                definition = {
                    rows: [{
                        dimension: 'pe'
                    }]
                };
                data = {
                    metaData: {
                        pe: ['somePeriodId', 'someOtherPeriodId'],
                        names: {
                            somePeriodId: 'somePeriodName',
                            someOtherPeriodId: 'someOtherPeriodName'
                        }
                    }
                };

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