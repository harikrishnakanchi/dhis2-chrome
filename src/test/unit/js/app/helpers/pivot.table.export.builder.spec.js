define(['pivotTableExportBuilder', 'angularMocks', 'dateUtils'], function (PivotTableExportBuilder, mocks, dateUtils) {
    describe('pivotTableExportBuilder', function () {
        var rootScope, exportBuilder;

        beforeEach(mocks.inject(function ($rootScope) {
            rootScope = $rootScope;

            rootScope.resourceBundle = {
                label: {
                    category: 'categoryLabel',
                    dataDimension: 'dataDimensionLabel',
                    period: 'periodLabel',
                    organisationUnit: 'orgUnitLabel'
                },
                weeksLabel: "weeks",
                July: "July",
                August: "August",
                September: "September"
            };

            exportBuilder = new PivotTableExportBuilder(rootScope);
        }));

        describe('build', function () {
            var exportContent, pivotTableData, outerColumnA, innerColumnA1, innerColumnA2, rowA, rowB, mockValue,
                DELIMITER = ',';

            var escapeString = function (string) {
                return '"' + string + '"';
            };

            beforeEach(function () {
                outerColumnA = {
                    name: 'periodA',
                    dataValuesFilter: {
                        pe: 'periodA'
                    }
                };
                innerColumnA1 = {
                    name: 'male',
                    categoryDimension: true,
                    dataValuesFilter: {
                        genderCategory: 'male'
                    }
                };
                innerColumnA2 = {
                    name: 'female',
                    categoryDimension: true,
                    dataValuesFilter: {
                        genderCategory: 'female'
                    }
                };
                rowA = {
                    name: 'dataElementA',
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: 'dataElementIdA'
                    }
                };
                rowB = {
                    name: 'dataElementB',
                    dataDimension: true,
                    dataValuesFilter: {
                        dx: 'dataElementIdB'
                    }
                };
                mockValue = 'mockValue';
                pivotTableData = {
                    columns: [
                        [outerColumnA],
                        [innerColumnA1, innerColumnA2]
                    ],
                    rows: [rowA, rowB],
                    getDisplayName: function (item) {
                        return item.name;
                    },
                    getDataValue: function () {
                        return mockValue;
                    }
                };
            });

            it('should contain the main column headers', function () {
                exportContent = exportBuilder.build(pivotTableData);

                var expectedHeader = [rootScope.resourceBundle.label.dataDimension, rootScope.resourceBundle.label.category, outerColumnA.name];
                expect(exportContent).toContain(expectedHeader);
            });

            it('should append the number of isoweeks to the column headers if column is a periodDimension and pivotTable is a monthlyReport', function () {
                spyOn(dateUtils, 'getNumberOfISOWeeksInMonth').and.returnValue(4);
                outerColumnA.periodDimension = true;
                pivotTableData.monthlyReport = true;
                exportContent = exportBuilder.build(pivotTableData);

                expect(_.first(exportContent)).toContain(outerColumnA.name + ' [4 '+ rootScope.resourceBundle.weeksLabel + ']');
            });

            it('should contain dataValues for rows', function () {
                exportContent = exportBuilder.build(pivotTableData);

                var expectedRowA1 = [rowA.name, innerColumnA1.name, mockValue],
                    expectedRowA2 = [rowA.name, innerColumnA2.name, mockValue],
                    expectedRowB1 = [rowB.name, innerColumnA1.name, mockValue],
                    expectedRowB2 = [rowB.name, innerColumnA2.name, mockValue];

                expect(exportContent).toContain(expectedRowA1);
                expect(exportContent).toContain(expectedRowA2);
                expect(exportContent).toContain(expectedRowB1);
                expect(exportContent).toContain(expectedRowB2);
            });

            describe('pivot table with only one column configuration', function () {
                it('should contain dataValues for rows', function () {
                    pivotTableData.columns = [
                        [outerColumnA]
                    ];
                    exportContent = exportBuilder.build(pivotTableData);

                    var expectedRowA = [rowA.name, mockValue],
                        expectedRowB = [rowB.name, mockValue];

                    expect(exportContent).toContain(expectedRowA);
                    expect(exportContent).toContain(expectedRowB);
                });
            });
        });
   });
});