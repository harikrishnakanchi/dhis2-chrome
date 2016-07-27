var fs = require('fs');

module.exports = function () {
    var path = '../src/main/js/app/i18n/resourceBundle';
    var en = require(path + '_en.json'),
        fr = require(path + '_fr.json'),
        ar = require(path + '_ar.json');
    var keys = Object.keys(en);
    var content = 'Key\tEnglish\tFrench\tArabic\r\nlocale\ten\tfr\tar';
    keys.forEach(function(key) {
        content += '\r\n';
        content += key + '\t';
        content += (en[key] || '') + '\t';
        content += (fr[key] || '') + '\t';
        content += (ar[key] || '');
    });
    fs.writeFile('translations.tsv', content, function () {
        console.log('Generated translations.tsv');
    });
};
