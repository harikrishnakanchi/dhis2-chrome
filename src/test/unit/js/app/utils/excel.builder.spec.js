define(['excelBuilder'], function (excelBuilder) {
    describe('ExcelBuilder', function () {
        describe('createWorkBook', function () {
            it('should return a Blob', function () {
                var actualValue = excelBuilder.createWorkBook();
                expect(actualValue).toEqual(jasmine.any(Blob));
            });
        });
    });
});