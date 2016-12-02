define(['lodash'], function (_) {
    var Sheet = function (sheetName) {
        var name = sheetName;
        var data = [],
            EMPTY_CELL = '',
            EMPTY_ROW = [],
            mergedCells = [],
            R = 0;

        var generate = function () {
            return {
                name: name,
                data: data,
                merges: mergedCells
            }
        };

        var createRow = function (values) {
            var C = 0;
            values = values || EMPTY_ROW;
            R = R && R + 1;
            C = C + values.length;
            data.push(values);

            var addCell = function (cell, options) {
                cell = cell || EMPTY_CELL;
                values.push(cell);
                C = C && C+1;

                var addEmptyCells = function (numberOfEmptyCells) {
                    var addEmpty = _.partial(addCell, null, null);
                    return _.times(numberOfEmptyCells, addEmpty)
                };

                if (options) {
                    var mergeCell = { s: {r: R, c: C}, e: {r: R, c: C + options.colspan} };
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