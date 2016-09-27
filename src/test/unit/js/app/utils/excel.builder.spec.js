define(['excelBuilder', 'xlsx'], function (excelBuilder, XLSX) {
    describe('excelBuilder', function () {
        describe('createWorkBook', function () {
            var workBookData, mockData, sheetA;

            beforeEach(function () {
                workBookData = undefined;
                spyOn(XLSX, 'write').and.callFake(function (workBookDataArg) {
                    workBookData = workBookDataArg;
                    return 'mockXLSX';
                });

                sheetA = {
                    name: 'someSheetName',
                    data: [
                        ['headerTitleA', 'headerTitleB'],
                        [123, 456],
                        [true, false],
                        [null]
                    ]
                };
                mockData = [sheetA];
            });

            it('should return a Blob', function () {
                var actualValue = excelBuilder.createWorkBook(mockData);
                expect(actualValue).toEqual(jasmine.any(Blob));
            });

            it('should set the sheet names', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.SheetNames).toEqual([sheetA.name]);
            });

            it('should set sheet data', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.Sheets[sheetA.name]).toBeDefined();
            });

            it('should set cell data for string values', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.Sheets[sheetA.name].A1).toEqual({ v: 'headerTitleA', t: 's' });
            });

            it('should set cell data for number values', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.Sheets[sheetA.name].A2).toEqual({ v: 123, t: 'n' });
            });

            it('should set cell data for boolean values', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.Sheets[sheetA.name].A3).toEqual({ v: true, t: 'b' });
            });

            it('should set cell data for other types of values', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.Sheets[sheetA.name].A4).toEqual({ v: null, t: 's' });
            });

            it('should set the range for the sheet', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.Sheets[sheetA.name]['!ref']).toEqual('A1:B4');
            });

            it('should set the column widths to the max number of characters in each column', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.Sheets[sheetA.name]['!cols']).toEqual([{ wch: 12 }, { wch: 12 }]);
            });
        });
    });
});