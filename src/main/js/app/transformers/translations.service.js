define(['lodash'], function(_){
    return function($q, db, $rootScope, ngI18nResourceBundle, systemSettingRepository) {
        var TRANSLATABLE_ENTITIES = ["sections", "dataElements", "headers", "programStages", "programStageSections", "programStageDataElements", "dataElement", "optionSet", "options", "dataValues", "attribute"],
            TRANSLATABLE_PROPERTIES = ["name", "description", "formName", "shortName", "displayName"],
            translations, categoryOptionCombosAndOptions, _locale, self = this;

        var refreshResourceBundle = function () {
            return ngI18nResourceBundle.get({ locale: _locale }).then(function (data) {
                $rootScope.resourceBundle = data.data;
            });
        };

        var updateLocaleInSystemSettings = function() {
            return systemSettingRepository.upsertLocale(_locale);
        };

        var buildCategoryOptionComboHash = function () {
            if(categoryOptionCombosAndOptions) return;

            var store = db.objectStore('categoryOptionCombos');
            return store.getAll().then(function(categoryOptionCombos) {
                categoryOptionCombosAndOptions = _.reduce(categoryOptionCombos, function (result, categoryOptionCombo) {
                    var categoryOptions = categoryOptionCombo.name.split(", ");
                    result[categoryOptionCombo.id] = _.map(categoryOptions, function (categoryOption) {
                        var originalCategoryOption = _.find(categoryOptionCombo.categoryOptions, { name: categoryOption});
                        return originalCategoryOption.id;
                    });
                    return result;
                }, {});
            });
        };

        this.setLocale = function(locale){
            _locale = locale;

            refreshResourceBundle();
            updateLocaleInSystemSettings();
            buildCategoryOptionComboHash();
            
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
                    if(item.description) {
                        var descriptionTranslation = _.find(translationObject, {property: "description"});
                        item.description = descriptionTranslation ? descriptionTranslation.value : item.description;
                    }
                    var shortNameTranslation = _.find(translationObject, {property: "shortName"});
                    item.name = shortNameTranslation ? shortNameTranslation.value : item.name;
                });
            });
        };

        var getTranslation = function (objectId, property) {
            var translationObject = _.find(translations[objectId], { property: property });
            return translationObject && translationObject.value;
        };

        this.getTranslationForProperty = function (objectId, property, defaultValue) {
            return getTranslation(objectId, property) || defaultValue;
        };

        this.translateCharts = function (chartData) {
            if(_locale == 'en') {
                return chartData;
            }

            var translatablePropertyIds = _.keys(chartData.metaData.names);
            _.each(translatablePropertyIds, function (id) {
                var isCategoryOptionCombo = _.get(categoryOptionCombosAndOptions, id);
                if (isCategoryOptionCombo) {
                    var translatedOptions = _.map(categoryOptionCombosAndOptions[id], function (categoryOptionId) {
                        return getTranslation(categoryOptionId, 'shortName');
                    });
                    if(translatedOptions.length == _.compact(translatedOptions).length)
                        chartData.metaData.names[id] = translatedOptions.join(', ');
                } else {
                    chartData.metaData.names[id] = getTranslation(id, 'shortName') || chartData.metaData.names[id];
                }

            });
            return chartData;
        };

        this.translateReferralLocations = function(arrayOfObjectsToBeTranslated) {
            if(_locale == 'en' && !_.isUndefined(arrayOfObjectsToBeTranslated)) {
                return arrayOfObjectsToBeTranslated;
            }
            return _.map(arrayOfObjectsToBeTranslated, function (objectToBeTranslated) {
                var translationObject = translations[objectToBeTranslated.id];

                _.each(TRANSLATABLE_PROPERTIES, function (property) {
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

        var translateObject = function (objectToBeTranslated) {
            var translationsForObject = translations[objectToBeTranslated.id] || [];

            _.each(TRANSLATABLE_PROPERTIES, function (property) {
                if(objectToBeTranslated[property]) {
                    var translationForProperty = _.find(translationsForObject, { property: property });
                    objectToBeTranslated['original_' + property] = objectToBeTranslated[property];
                    objectToBeTranslated[property] = translationForProperty && translationForProperty.value || objectToBeTranslated[property];
                }
            });

            _.each(TRANSLATABLE_ENTITIES, function (entity) {
                var nestedEntity = objectToBeTranslated[entity];
                if(nestedEntity) {
                    self.translate(nestedEntity);
                }
            });

            return objectToBeTranslated;
        };

        this.translate = function (objectToBeTranslated) {
            if(_locale == 'en' || _.isUndefined(objectToBeTranslated)) {
                return objectToBeTranslated;
            }

            return _.isArray(objectToBeTranslated) ? _.map(objectToBeTranslated, self.translate) : translateObject(objectToBeTranslated);
        };
    };
});
