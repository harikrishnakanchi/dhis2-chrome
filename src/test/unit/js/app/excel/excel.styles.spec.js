define(['excelStyles'], function (excelStyles) {
    describe('excelStyle', function () {
        it('should generate a end style object for specified style', function () {
            expect(excelStyles.generateStyle([excelStyles.BOLD])).toEqual(excelStyles.BOLD);
        });

        it('should generate a end style object for multiple specified styles', function () {
            expect(excelStyles.generateStyle([excelStyles.BOLD, excelStyles.LEFT_ALIGNMENT])).toEqual({
                font: {
                    bold: true
                },
                alignment: {
                    horizontal: 'left'
                }
            });
        });

        it('should generate a end style object for duplicate specified styles', function () {
            expect(excelStyles.generateStyle([excelStyles.BOLD, excelStyles.BOLD])).toEqual(excelStyles.BOLD);
        });

        it('should gracefully generate a end style object if single input style object is sent', function () {
            expect(excelStyles.generateStyle(excelStyles.BOLD)).toEqual(excelStyles.BOLD);
        });
    });
});