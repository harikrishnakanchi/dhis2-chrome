var fs = require('fs');

module.exports = function () {
    var path = '../src/main/js/app/i18n/resourceBundle';
    var en = require(path + '_en.json'),
        fr = require(path + '_fr.json'),
        ar = require(path + '_ar.json');
    var content = 'Key\tEnglish\tFrench\tArabic\r\nlocale\ten\tfr\tar';

    var printTranslations = function(en, fr, ar, parentKeys) {
        var keys = Object.keys(en);

        keys.forEach(function (key) {
            if(typeof en[key] == 'object') {
                printTranslations(en[key], fr[key] || {}, ar[key] || {}, parentKeys.concat(key));
            } else {
                content += '\r\n';
                content += parentKeys.concat(key).join('.') + '\t';
                content += (en[key] || '') + '\t';
                content += (fr[key] || '') + '\t';
                content += (ar[key] || '');
            }
        });
    };

    printTranslations(en, fr, ar, []);

    fs.writeFile('translations.tsv', content, function () {
        console.log('Generated translations.tsv');
    });
};
