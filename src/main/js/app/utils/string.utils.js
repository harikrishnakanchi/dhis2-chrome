define(function () {
    var REPLACEMENT_CHARACTERS = {
        '<': String.fromCharCode(0x02C2),
        '>': String.fromCharCode(0x02C3)
    };

    var replaceSpecialCharacters = function (string) {
        if(string) {
            for(var symbol in REPLACEMENT_CHARACTERS) {
                var regex = new RegExp(symbol, 'g');
                string = string.replace(regex, REPLACEMENT_CHARACTERS[symbol]);
            }
        }
        return string;
    };

    return {
        replaceSpecialCharacters: replaceSpecialCharacters
    };
});