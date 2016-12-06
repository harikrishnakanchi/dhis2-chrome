define(['excelBuilderHelper'], function (excelBuilderHelper) {
    var sheetName = "SheetName", sheetObject, sheetResult;

    describe('excelBuilderHelper', function () {
        var generateSheet = function () {
            sheetResult = sheetObject.generate();
        };
        beforeEach(function () {
            sheetObject = excelBuilderHelper.createSheet(sheetName);
        });


        it('should create a sheet', function () {
            generateSheet();
            expect(sheetResult.name).toEqual(sheetName);
        });

        it('should able to create a row with values', function () {
            var rowValues = [1, 2, 3];
            sheetObject.createRow(rowValues);
            generateSheet();
            expect(sheetResult.data).toContain(rowValues);
        });

        it('should able to create a empty row if no values are passed', function () {
            sheetObject.createRow();
            generateSheet();
            expect(sheetResult.data).toContain([]);
        });

        it('should able to add individual values to the row', function () {
            var rowValues = [1, 2, 3];
            var row = sheetObject.createRow(rowValues);
            row.addCell(4);
            generateSheet();
            expect(sheetResult.data).toContain([1, 2, 3, 4]);
        });

        it('should able to add empty cell to the row when no values are passed', function () {
            var rowValues = [1, 2, 3];
            var row = sheetObject.createRow(rowValues);
            row.addCell();
            generateSheet();
            expect(sheetResult.data).toContain([1, 2, 3, '']);
        });

        it('should add empty cells to row when colspan is specified', function () {
            var row = sheetObject.createRow();
            row.addCell(4, {colspan: 2});
            generateSheet();
            expect(sheetResult.data).toContain([4, '']);
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
            expect(sheetResult.data).toContain(['', '', '']);
        });

    });
});