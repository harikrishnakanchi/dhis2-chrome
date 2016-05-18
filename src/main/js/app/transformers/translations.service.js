define([],function(){
    return function($q, db, $rootScope, ngI18nResourceBundle, systemSettingRepository) {
        var translatableTypes = ["sections", "dataElements", "headers", "programStages", "programStageSections", "programStageDataElements", "dataElement", "optionSet", "options", "dataValues"];
        var translatableProperties = ["name", "description", "formName", "shortName", "displayName"];
        var translations;

        var setResourceBundleLocale = function (locale) {
            var updateLocaleInSystemSettings = function () {
                return $q.when(systemSettingRepository.upsertLocale($rootScope.locale));
            };

            ngI18nResourceBundle.get({
                "locale": locale
            }).then(function (data) {
                $rootScope.resourceBundle = data.data;
                updateLocaleInSystemSettings();
            });
        };
            
        var setLocale = function(locale){
            this.locale = locale;
            setResourceBundleLocale(locale);
            
            var store = db.objectStore('translations');
            var query = db.queryBuilder().$index('by_locale').$eq(locale).compile();
            return store.each(query).then(function(data) {
                translations = data;
            });
        };

        var translateReports = function (reportsToTranslate) {
            if(this.locale == 'en') {
                return $q.when(reportsToTranslate);
            }

            var result = _.each(reportsToTranslate, function (report) {
                var items = report.definition.rows[0].items;
                var namesHash = report.data ? report.data.metaData.names : {};
                return _.each(items, function (item) {
                    var translationObject = _.filter(translations, {objectId: item.id});
                    var translationsByProperty = _.filter(translationObject, {property: "shortName"});
                    namesHash[item.id] = translationsByProperty.length > 0 ? translationsByProperty[0].value : item.name;
                });
            });

            return $q.when(result);
        };

        var translateOptionSetMap = function (optionSetMap) {
            if(this.locale == 'en') {
                return optionSetMap;
            }
            
            _.each(optionSetMap, function(value) {
                return translate(value);
            });
            return optionSetMap;
        };

        var translateOptionMap = function (optionMap) {
            if(this.locale == 'en') {
                return optionMap;
            }

            _.each(optionMap, function(value, key) {
                var translationObject = _.find(translations, function(translation) {
                    return translation.objectId == key;
                });
                optionMap[key] = translationObject ? translationObject.value : value;
            });

            return optionMap;
        };
        var translate = function(objectsToBeTranslated){
            if(this.locale == 'en') {
                return objectsToBeTranslated;
            }

            _.each(objectsToBeTranslated, function (objectToBeTranslated) {

                var translationObject = _.filter(translations, function(translation) {
                    return translation.objectId == objectToBeTranslated.id || translation.objectId == objectToBeTranslated.dataElement;
                });
                
                _.each(translatableProperties, function (property) {
                    if(objectToBeTranslated[property]) {
                        var translationsByProperty = _.filter(translationObject, {property: property});
                        objectToBeTranslated[property] = translationsByProperty[0] ? translationsByProperty[0].value : objectToBeTranslated[property];
                    }
                });

                _.each(objectToBeTranslated, function (value, key) {
                    if(_.isArray(value) && _.contains(translatableTypes, key)){
                        _.each(value,function(object){
                            translate(_.flatten([object]));
                        });
                    } else if(_.isObject(value) && _.contains(translatableTypes, key)){
                        translate([value]);
                    }
                });
            });

            return objectsToBeTranslated;
        };

        return {
            setLocale: setLocale,
            translate: translate,
            translateReports: translateReports,
            translateOptionMap: translateOptionMap,
            translateOptionSetMap: translateOptionSetMap
        };
    };
});