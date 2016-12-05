define(['lodash'], function (_) {
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
            column = column + values.length;
            row = row + 1;
            data[row] = values;

            var addEmptyCells = function (numberOfEmptyCells) {
                var addEmpty = _.partial(addCell, null, null);
                return _.times(numberOfEmptyCells, addEmpty);
            };

            var addCell = function (cell, options) {
                cell = cell || EMPTY_CELL;
                column = column + 1;
                data[row][column] = cell;

                if (options) {
                    var mergeCell = {s: {r: row, c: column}, e: {r: row, c: (column + options.colspan - 1)}};
                    mergedCells.push(mergeCell);
                    addEmptyCells(options.colspan - 1);
                }
            };

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