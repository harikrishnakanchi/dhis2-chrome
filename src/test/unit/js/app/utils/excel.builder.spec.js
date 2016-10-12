define(['excelBuilder', 'xlsx'], function (excelBuilder, XLSX) {
    describe('excelBuilder', function () {
        describe('createWorkBook', function () {
            var workBookData, mockData, sheetA, someMomentInTime;

            beforeEach(function () {
                workBookData = undefined;
                spyOn(XLSX, 'write').and.callFake(function (workBookDataArg) {
                    workBookData = workBookDataArg;
                    return 'mockXLSX';
                });

                someMomentInTime = new Date('2016-8-28');
                sheetA = {
                    name: 'someSheetName',
                    data: [
                        ['headerTitleA', 'headerTitleB'],
                        [123, 456],
                        [true, false],
                        [someMomentInTime],
                        [null, undefined]
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
                expect(workBookData.Sheets[sheetA.name].B3).toEqual({ v: false, t: 'b' });
            });

            it('should set cell data for other types of values', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.Sheets[sheetA.name].A4).toEqual({ v: someMomentInTime, t: 's' });
            });

            it('should ignore null and undefined values', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.Sheets[sheetA.name].A5).toBeUndefined();
                expect(workBookData.Sheets[sheetA.name].B5).toBeUndefined();
            });

            it('should set the range for the sheet', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.Sheets[sheetA.name]['!ref']).toEqual('A1:B5');
            });

            it('should set the column widths to the max number of characters in each column', function () {
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.Sheets[sheetA.name]['!cols']).toEqual([{ wch: 12 }, { wch: 12 }]);
            });

            it('should replace special characters in sheet names', function () {
                sheetA.name = '2>1 & \' < "';
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.SheetNames).toEqual(['2&gt;1 &amp; &apos; &lt; &quot;']);
            });

            it('should truncate sheet names to 32 characters', function () {
                sheetA.name = '5____10___15___20___25___30___&';
                excelBuilder.createWorkBook(mockData);
                expect(workBookData.SheetNames).toEqual(['5____10___15___20___25___30___']);
            });
        });
    });
});