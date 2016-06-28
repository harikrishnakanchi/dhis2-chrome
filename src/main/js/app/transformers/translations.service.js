define(['lodash'], function(_){
    return function($q, db, $rootScope, ngI18nResourceBundle, systemSettingRepository) {
        var translatableTypes = ["sections", "dataElements", "headers", "programStages", "programStageSections", "programStageDataElements", "dataElement", "optionSet", "options", "dataValues", "attribute"],
            translatableProperties = ["name", "description", "formName", "shortName", "displayName"],
            translations, _locale, self = this;

        var refreshResourceBundle = function () {
            return ngI18nResourceBundle.get({ locale: _locale }).then(function (data) {
                $rootScope.resourceBundle = data.data;
            });
        };

        var updateLocaleInSystemSettings = function() {
            return systemSettingRepository.upsertLocale(_locale);
        };

        this.setLocale = function(locale){
            _locale = locale;

            refreshResourceBundle();
            updateLocaleInSystemSettings();
            
            var store = db.objectStore('translations');
            var query = db.queryBuilder().$index('by_locale').$eq(locale).compile();
            return store.each(query).then(function(data) {
                var validTranslationsWithObjectId = _.filter(data, 'objectId');
                translations = _.groupBy(validTranslationsWithObjectId, 'objectId');
            });
        };

        this.translateReports = function (reportsToTranslate) {
            if(_locale == 'en') {
                return reportsToTranslate;
            }

            return _.each(reportsToTranslate, function (report) {
                var items = report.definition.rows[0].items;
                var namesHash = report.data ? report.data.metaData.names : {};
                return _.each(items, function (item) {
                    var translationObject = translations[item.id];
                    var translationsByProperty = _.filter(translationObject, {property: "shortName"});
                    namesHash[item.id] = translationsByProperty.length > 0 ? translationsByProperty[0].value : item.name;
                });
            });
        };

        this.translateReferralLocations = function(arrayOfObjectsToBeTranslated) {
            if(_locale == 'en' && !_.isUndefined(arrayOfObjectsToBeTranslated)) {
                return arrayOfObjectsToBeTranslated;
            }
            return _.map(arrayOfObjectsToBeTranslated, function (objectToBeTranslated) {
                var translationObject = translations[objectToBeTranslated.id];

                _.each(translatableProperties, function (property) {
                    if(objectToBeTranslated[property]) {
                        var translationsByProperty = _.filter(translationObject, {property: property});
                        objectToBeTranslated[property] = translationsByProperty[0] ? translationsByProperty[0].value : objectToBeTranslated[property];
                    }
                });

                _.each(objectToBeTranslated, function(value, key) {
                    if(_.isArray(value) && _.contains("sections", key)){
                        _.each(value,function(object){
                            self.translateReferralLocations([object]);
                        });
                    }
                });
                return objectToBeTranslated;
            });
        };

        this.translateOptionSetMap = function (optionSetMap) {
            if(_locale == 'en') {
                return optionSetMap;
            }
            
            _.each(optionSetMap, function(value) {
                self.translate(value);
            });
            return optionSetMap;
        };

        this.translateOptionMap = function (optionMap) {
            if(_locale == 'en') {
                return optionMap;
            }

            _.each(optionMap, function(value, key) {
                optionMap[key] = translations[key] ? translations[key][0].value : value;
            });

            return optionMap;
        };

        this.translate = function(objectsToBeTranslated) {
            if(_locale == 'en') {
                return objectsToBeTranslated;
            }

            _.each(objectsToBeTranslated, function (objectToBeTranslated) {
                var translationObject = translations[objectToBeTranslated.id] || [];

                _.each(translatableProperties, function (property) {
                    if(objectToBeTranslated[property]) {
                        var translationsByProperty = _.filter(translationObject, {property: property});
                        objectToBeTranslated[property] = translationsByProperty[0] ? translationsByProperty[0].value : objectToBeTranslated[property];
                    }
                });

                _.each(objectToBeTranslated, function (value, key) {
                    if(_.isArray(value) && _.contains(translatableTypes, key)){
                        _.each(value,function(object){
                            self.translate(_.flatten([object]));
                        });
                    } else if(_.isObject(value) && _.contains(translatableTypes, key)){
                        self.translate([value]);
                    }
                });
            });

            return objectsToBeTranslated;
        };
    };
});
