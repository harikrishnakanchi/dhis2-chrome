define(['lodash'], function(_){
    return function($q, db, $rootScope, ngI18nResourceBundle, systemSettingRepository) {
        var TRANSLATABLE_ENTITIES = ["sections", "dataElements", "headers", "programStages", "programStageSections", "programStageDataElements", "dataElement", "optionSet", "options", "dataValues", "attribute"],
            TRANSLATABLE_PROPERTIES = ["name", "description", "formName", "shortName", "displayName"],
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

        var translateMonthlyPeriods = function (monthlyPeriods) {
            var SEPARATOR = ' ';
            _.each(monthlyPeriods, function (period) {
                var monthToBeTranslated = _.first(period.name.split(SEPARATOR)),
                    year = _.last(period.name.split(SEPARATOR));

                period.name = $rootScope.resourceBundle[monthToBeTranslated] + SEPARATOR + year;
            });
        };

        this.translatePivotTableData = function (pivotTableDataObjects) {
            if(_locale == 'en') {
                return pivotTableDataObjects;
            }

            return _.map(pivotTableDataObjects, function (pivotTableDataObject) {
                var rowsAndColumns = pivotTableDataObject.referralLocationReport ?
                        _.flattenDeep([pivotTableDataObject.columns, pivotTableDataObject.columnConfigurations]) :
                        _.flattenDeep([pivotTableDataObject.rows,  pivotTableDataObject.columns, pivotTableDataObject.columnConfigurations]),
                    translatableDimensions = _.reject(rowsAndColumns, 'periodDimension'),
                    periodDimensions = _.filter(rowsAndColumns, 'periodDimension');

                self.translate(translatableDimensions);
                if(pivotTableDataObject.monthlyReport) translateMonthlyPeriods(periodDimensions);

                return pivotTableDataObject;
            });
        };

        var getTranslation = function (objectId, property) {
            var translationObject = _.find(translations[objectId], { property: property });
            return translationObject && translationObject.value;
        };

        this.getTranslationForProperty = function (objectId, property, defaultValue) {
            return getTranslation(objectId, property) || defaultValue;
        };

        this.translateChartData = function (charts) {
            if(_locale == 'en') {
                return charts;
            }

            return _.map(charts, function (chart) {
                var dimensions = _.flattenDeep([chart.series, chart.categories]),
                    translatableDimensions = _.reject(dimensions, 'periodDimension'),
                    periodDimensions = _.filter(dimensions, 'periodDimension');

                self.translate(translatableDimensions);
                if(chart.monthlyChart) translateMonthlyPeriods(periodDimensions);

                return chart;
            });
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
                var translationForProperty = _.find(translationsForObject, { property: property });
                if(translationForProperty && translationForProperty.value) {
                    objectToBeTranslated[property] = translationForProperty.value;
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
