define(['xlsx', 'lodash'], function (XLSX, _) {

    var CELL_TYPES = {
        boolean: 'b',
        number: 'n',
        string: 's',
        default: 's'
    };

    var ESCAPED_CHARACTERS = {
        '&': '&amp;',
        '"': '&quot;',
        '\'': '&apos;',
        '<': '&lt;',
        '>': '&gt;',
        '[': '',
        ']': '',
        '*': '',
        '?': '',
        ':': '',
        '/': '',
        '\\': ''
    };

    var DEFAULT_COLUMN_WIDTH = 10,
        SHEET_NAME_CHARACTER_LIMIT = 32;

    var stringToArrayBuffer = function (string) {
        var buffer = new ArrayBuffer(string.length);
        var view = new Uint8Array(buffer);
        for (var i=0; i!=string.length; ++i) view[i] = string.charCodeAt(i) & 0xFF;
        return buffer;
    };

    var escapeXmlSpecialCharacters = function (string) {
        return _.reduce(ESCAPED_CHARACTERS, function (string, replacement_character, character) {
            return string.replace(character, replacement_character);
        }, string);
    };

    var escapeAndTruncateString = function (string) {
        var escapedString = escapeXmlSpecialCharacters(string);

        if (escapedString.length > SHEET_NAME_CHARACTER_LIMIT) {
            var truncatedString = string.substring(0, _.min([SHEET_NAME_CHARACTER_LIMIT, string.length - 1]));
            return escapeAndTruncateString(truncatedString);
        } else {
            return escapedString;
        }
    };

    var escapeAndTruncateSheetNames = function (sheets) {
        return _.each(sheets, function (sheet) {
            sheet.name = escapeAndTruncateString(sheet.name);
        });
    };

    var createCellObject = function (cell) {
        var cellValue = _.isPlainObject(cell) ? cell.value : cell;
        var type = CELL_TYPES[typeof cellValue] || CELL_TYPES.default;
        var obj = {
            v: cellValue,
            t: type
        };

        if (_.isPlainObject(cell)) {
            _.set(obj, 's', cell.style);
        }
        return obj;
    };

    var createSheetObject = function (sheetData) {
        var maxRowIndex = 0,
            maxColumnIndex = 0,
            columnWidths = {},
            sheetObject = {};

        _.each(sheetData, function (row, rowIndex) {
            maxRowIndex = _.max([maxRowIndex, rowIndex]);
            _.each(row, function (cell, columnIndex) {
                if(_.isNull(cell) || _.isUndefined(cell)) return;
                var cellReference = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
                sheetObject[cellReference] = createCellObject(cell);
                maxColumnIndex = _.max([maxColumnIndex, columnIndex]);
                columnWidths[columnIndex] = _.max([columnWidths[columnIndex], sheetObject[cellReference].v.length, DEFAULT_COLUMN_WIDTH]);
            });
        });

        sheetObject['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: maxRowIndex, c: maxColumnIndex });
        sheetObject['!cols'] = _.map(columnWidths, function(width) { return { wch: width }; });
        return sheetObject;
    };

    var createWorkBookObject = function (sheets) {
        escapeAndTruncateSheetNames(sheets);

        return {
            SheetNames: _.map(sheets, 'name'),
            Sheets: _.reduce(sheets, function (sheetsObject, sheet) {
                var sheetObject = createSheetObject(sheet.data);
                if (sheet.merges) {
                    sheetObject['!merges'] = sheet.merges;
                }
                return _.set(sheetsObject, sheet.name, sheetObject);
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


