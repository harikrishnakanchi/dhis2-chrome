define(['pivotTableCsvBuilder', 'angularMocks', 'dateUtils'], function (PivotTableCSVBuilder, mocks, dateUtils) {
    describe('pivotTableCSVBuilder', function () {
        var rootScope, csvBuilder;

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

            csvBuilder = new PivotTableCSVBuilder(rootScope);
        }));

        describe('build', function () {
            var csvContent, pivotTableData, outerColumnA, innerColumnA1, innerColumnA2, rowA, rowB, mockValue,
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
                csvContent = csvBuilder.build(pivotTableData);

                var expectedHeader = [escapeString(rootScope.resourceBundle.label.dataDimension), escapeString(rootScope.resourceBundle.label.category), escapeString(outerColumnA.name)].join(DELIMITER);
                expect(csvContent).toContain(expectedHeader);
            });

            it('should append the number of isoweeks to the column headers if column is a periodDimension and pivotTable is a monthlyReport', function () {
                spyOn(dateUtils, 'getNumberOfISOWeeksInMonth').and.returnValue(4);
                outerColumnA.periodDimension = true;
                pivotTableData.monthlyReport = true;
                csvContent = csvBuilder.build(pivotTableData);

                expect(csvContent).toContain(escapeString(outerColumnA.name + ' [4 '+ rootScope.resourceBundle.weeksLabel + ']'));
            });

            it('should contain dataValues for rows', function () {
                csvContent = csvBuilder.build(pivotTableData);

                var expectedRowA1 = [escapeString(rowA.name), escapeString(innerColumnA1.name), mockValue].join(DELIMITER),
                    expectedRowA2 = [escapeString(rowA.name), escapeString(innerColumnA2.name), mockValue].join(DELIMITER),
                    expectedRowB1 = [escapeString(rowB.name), escapeString(innerColumnA1.name), mockValue].join(DELIMITER),
                    expectedRowB2 = [escapeString(rowB.name), escapeString(innerColumnA2.name), mockValue].join(DELIMITER);

                expect(csvContent).toContain(expectedRowA1);
                expect(csvContent).toContain(expectedRowA2);
                expect(csvContent).toContain(expectedRowB1);
                expect(csvContent).toContain(expectedRowB2);
            });
        });
   });
});