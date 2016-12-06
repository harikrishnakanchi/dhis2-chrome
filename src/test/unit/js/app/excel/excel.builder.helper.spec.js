define(['excelBuilderHelper', 'excelStyles'], function (excelBuilderHelper, excelStyles) {
    var sheetName = "SheetName", sheetObject, sheetResult, mockStyle;

    describe('excelBuilderHelper', function () {
        var generateSheet = function () {
            sheetResult = sheetObject.generate();
        };

        var mockCellObject = function (cellValue) {
            return {value: cellValue, style: mockStyle};
        };

        beforeEach(function () {
            mockStyle = {"border": "top"};
            spyOn(excelStyles, 'generateStyle').and.returnValue(mockStyle);
            sheetObject = excelBuilderHelper.createSheet(sheetName);
        });


        it('should create a sheet', function () {
            generateSheet();
            expect(sheetResult.name).toEqual(sheetName);
        });

        it('should able to create a row with values', function () {
            var rowValues = [1, 2];
            sheetObject.createRow(rowValues);
            generateSheet();
            expect(sheetResult.data).toContain([mockCellObject(1), mockCellObject(2)]);
        });

        it('should able to create a empty row if no values are passed', function () {
            sheetObject.createRow();
            generateSheet();
            expect(sheetResult.data).toContain([]);
        });

        it('should able to add individual values to the row', function () {
            var rowValues = [1];
            var row = sheetObject.createRow(rowValues);
            row.addCell(2);
            generateSheet();
            expect(sheetResult.data).toContain([mockCellObject(1), mockCellObject(2)]);
        });

        it('should able to add empty cell to the row when no values are passed', function () {
            var rowValues = [1, 2];
            var row = sheetObject.createRow(rowValues);
            row.addCell();
            generateSheet();
            expect(sheetResult.data).toContain([mockCellObject(1), mockCellObject(2), mockCellObject('')]);
        });

        it('should add empty cells to row when colspan is specified', function () {
            var row = sheetObject.createRow();
            row.addCell(4, {colspan: 2});
            generateSheet();
            expect(sheetResult.data).toContain([mockCellObject(4), mockCellObject('')]);
        });

        it('should add indices of cells to merged in an array', function () {
            var row = sheetObject.createRow();
            row.addCell(4, {colspan: 2});
            generateSheet();
            expect(sheetResult.merges).toContain({s: {r: 0, c: 0}, e: {r: 0, c: 1}});
        });

        it('should add n empty cells to a row', function () {
            var row = sheetObject.createRow();
            row.addEmptyCells(3);
            generateSheet();
            expect(sheetResult.data).toContain([mockCellObject(''), mockCellObject(''), mockCellObject('')]);
        });

        it('should add styling to a cell if specified along with default styling', function () {
            var mockStyleObject = { font: 'bold'};
            var row = sheetObject.createRow();
            row.addCell(3, {style: mockStyleObject});
            generateSheet();
            expect(sheetResult.data[0][0].style.font).toEqual('bold');
            expect(sheetResult.data[0][0].style.border).toEqual('top');
        });

        it('should override default styling to a cell if specified', function () {
            var mockStyleObject = { border: 'bottom'};
            var row = sheetObject.createRow();
            row.addCell(3, {style: mockStyleObject});
            generateSheet();
            expect(sheetResult.data[0][0].style.border).toEqual('bottom');
        });

    });
});