define([], function () {
    var BORDERED_CELL = {
        border: {
            left: {style: 'thin', color: {auto: 1}},
            top: {style: 'thin', color: {auto: 1}},
            right: {style: 'thin', color: {auto: 1}},
            bottom: {style: 'thin', color: {auto: 1}}
        }
    };

    var LEFT_ALIGNMENT = {
        alignment: {
            horizontal: 'left'
        }
    };

    var CENTER_ALIGNMENT = {
        alignment: {
            horizontal: 'center'
        }
    };

    var BOLD = {
        font: {
            bold: true
        }
    };

    var generateStyle = function (styles) {
        styles = _.isArray(styles) ? styles : [styles];
        return _.reduce(styles, function (result, style) {
            return Object.assign(result, style);
        }, {});
    };

    return {
        BORDERED_CELL: BORDERED_CELL,
        LEFT_ALIGNMENT: LEFT_ALIGNMENT,
        CENTER_ALIGNMENT: CENTER_ALIGNMENT,
        BOLD: BOLD,
        generateStyle: generateStyle
    };
});