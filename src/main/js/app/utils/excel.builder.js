define(['xlsx', 'lodash'], function (XLSX, _) {

    var CELL_TYPES = {
        boolean: 'b',
        number: 'n',
        string: 's',
        default: 's'
    };

    var stringToArrayBuffer = function (string) {
        var buffer = new ArrayBuffer(string.length);
        var view = new Uint8Array(buffer);
        for (var i=0; i!=string.length; ++i) view[i] = string.charCodeAt(i) & 0xFF;
        return buffer;
    };

    var createCellObject = function (cellValue) {
        return {
            v: cellValue,
            t: CELL_TYPES[typeof cellValue] || CELL_TYPES.default
        };
    };

    var createSheetObject = function (sheetData) {
        var maxRowIndex = 0,
            maxColumnIndex = 0,
            sheetObject = {};

        _.each(sheetData, function (row, rowIndex) {
            maxRowIndex = _.max([maxRowIndex, rowIndex]);
            _.each(row, function (cell, columnIndex) {
                var cellReference = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
                sheetObject[cellReference] = createCellObject(cell);
                maxColumnIndex = _.max([maxColumnIndex, columnIndex]);
            });
        });

        sheetObject['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: maxRowIndex, c: maxColumnIndex });
        return sheetObject;
    };

    var createWorkBookObject = function (sheets) {
        return {
            SheetNames: _.map(sheets, 'name'),
            Sheets: _.reduce(sheets, function (sheetsObject, sheet) {
                return _.set(sheetsObject, sheet.name, createSheetObject(sheet.data));
            }, {})
        };
    };

    var createWorkBook = function (workBookData) {
        var xlsxString = XLSX.write(createWorkBookObject(workBookData), { bookType: 'xlsx', bookSST: true, type: 'binary' });
        return new Blob([stringToArrayBuffer(xlsxString)], { type: "application/octet-stream" });
    };

    return {
        createWorkBook: createWorkBook
    };
});


