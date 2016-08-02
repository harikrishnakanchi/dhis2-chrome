var argv = require('yargs').argv;
var fs = require('fs');

module.exports = function () {
    if(!argv.tsvFilePath) {
        console.log('Please specify TSV file path.\nUsage: gulp import-translations --tsvFilePath fileName.tsv');
        return;
    }

    var newTranslationsFilepath = argv.tsvFilePath,
        resourceBundlePath = './src/main/js/app/i18n/resourceBundle_',
        relativeResourceBundlePath = '.' + resourceBundlePath,
        translations = {
            en: require(relativeResourceBundlePath + 'en.json'),
            fr: require(relativeResourceBundlePath + 'fr.json'),
            ar: require(relativeResourceBundlePath + 'ar.json')
        };

    fs.readFile(newTranslationsFilepath, function (err, fileContents) {
        if(err) throw new Error(err);

        var contents = fileContents.toString('utf8'),
            lines = contents.split('\r\n'),
            locales = lines[1].split('\t').slice(1),
            newTranslations = lines.slice(2);

        var keyPathExists = function (object, keyPath) {
            var key = keyPath.shift();

            if(key in object) {
                return keyPath.length == 0 ? true : keyPathExists(object[key], keyPath);
            } else {
                return false
            }
        };

        var setTranslation = function (object, keyPath, translation) {
            var key = keyPath.shift();

            if(keyPath.length == 0) {
                object[key] = translation;
            } else {
                object[key] = object[key] || {};
                setTranslation(object[key], keyPath, translation);
            }
        };

        newTranslations.forEach(function(newTranslation) {
            var values = newTranslation.split('\t'),
                translationKey = values[0],
                translationValues = values.slice(1);

            if(keyPathExists(translations.en, translationKey.split('.'))) {
                locales.forEach(function (locale, index) {
                    setTranslation(translations[locale], translationKey.split('.'), translationValues[index]);
                });
            } else if(translationKey) {
                console.log('Translation key does not exist: ' + translationKey);
            }
        });

        locales.forEach(function (locale) {
            fs.writeFile(resourceBundlePath + locale + '.json', JSON.stringify(translations[locale], undefined, 4), function () {
                console.log('Updated translations for locale: ' + locale);
            });
        });
    });
};