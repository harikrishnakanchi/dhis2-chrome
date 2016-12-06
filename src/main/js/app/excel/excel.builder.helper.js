define(['lodash', 'excelStyles'], function (_, excelStyles) {
    var Sheet = function (sheetName) {
        var name = sheetName;
        var data = [],
            EMPTY_CELL = '',
            mergedCells = [],
            row = -1;

        var generate = function () {
            return {
                name: name,
                data: data,
                merges: mergedCells,
                cellStyle: true
            };
        };

        var createRow = function (values) {
            var column = -1, EMPTY_ROW = [];
            values = values || EMPTY_ROW;
            row = row + 1;
            data[row] = [];

            var addEmptyCells = function (numberOfEmptyCells) {
                var addEmpty = _.partial(addCell, null, null);
                return _.times(numberOfEmptyCells, addEmpty);
            };

            var addCell = function (cellValue, options) {
                cellValue = cellValue || EMPTY_CELL;
                column = column + 1;
                var DEFAULT_STYLE = excelStyles.generateStyle([excelStyles.BORDERED_CELL, excelStyles.CENTER_ALIGNMENT]);
                var cellStyle = Object.assign({}, DEFAULT_STYLE, options && options.style);
                data[row][column] = {value: cellValue, style: cellStyle};

                if (options) {
                    if (options.colspan) {
                        var mergeCell = {s: {r: row, c: column}, e: {r: row, c: (column + options.colspan - 1)}};
                        mergedCells.push(mergeCell);
                        addEmptyCells(options.colspan - 1);
                    }
                }
            };

            _.forEach(values, addCell);

            return {
                addCell: addCell,
                addEmptyCells: addEmptyCells
            };
        };

        return {
            createRow: createRow,
            generate: generate
        };
    };

    var createSheet = function (sheetName) {
        return new Sheet(sheetName);
    };
    return {
        createSheet: createSheet
    };

});