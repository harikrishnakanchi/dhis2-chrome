define(['lodash'], function (_) {
    var Sheet = function (sheetName) {
        var name = sheetName;
        var data = [],
            EMPTY_CELL = '',
            EMPTY_ROW = [],
            mergedCells = [],
            row = 0;

        var generate = function () {
            return {
                name: name,
                data: data,
                merges: mergedCells
            };
        };

        var createRow = function (values) {
            var column = 0;
            values = values || EMPTY_ROW;
            row = row && row + 1;
            column = column + values.length;
            data.push(values);

            var addCell = function (cell, options) {
                cell = cell || EMPTY_CELL;
                values.push(cell);
                column = column && column+1;

                var addEmptyCells = function (numberOfEmptyCells) {
                    var addEmpty = _.partial(addCell, null, null);
                    return _.times(numberOfEmptyCells, addEmpty);
                };

                if (options) {
                    var mergeCell = { s: {r: row, c: column}, e: {r: row, c: column + options.colspan} };
                    mergedCells.push(mergeCell);
                    addEmptyCells(options.colspan - 1);
                }
            };

            return {
                addCell: addCell
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