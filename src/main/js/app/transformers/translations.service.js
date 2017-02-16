define(['lodash'], function(_){
    return function($q, db, $rootScope, ngI18nResourceBundle, systemSettingRepository) {
        var TRANSLATABLE_ENTITIES = ["sections", "dataElements", "headers", "programStages", "programStageSections", "columnConfigurations", "programStageDataElements", "dataElement", "optionSet", "options", "dataValues", "attribute"],
            TRANSLATABLE_OBJECT_PROPERTIES = ["name", "description", "formName", "shortName", "displayName"],
            TRANSLATABLE_PROPERTIES_MAP = {'name': 'NAME', 'description': 'DESCRIPTION', 'formName': 'FORM_NAME', 'shortName': 'SHORT_NAME'},
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

        var getTranslationFromCollection = function (translationsCollection, property, defaultValue) {
            var translationObject = _.find(translationsCollection, { property: property });
            return (translationObject && translationObject.value) || defaultValue;
        };

        this.getTranslationForProperty = function (object, property, defaultValue) {
            return getTranslationFromObject(object, property, defaultValue);
        };

        var getTranslationFromObject = function (object, property, defaultValue) {
            if (object && object.translations) {
                return getTranslationFromCollection(_.filter(object.translations, {locale: _locale}), TRANSLATABLE_PROPERTIES_MAP[property], defaultValue);
            }
            return getTranslationFromCollection(translations[object.id], property, defaultValue);
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

                _.each(TRANSLATABLE_OBJECT_PROPERTIES, function (property) {
                    if(objectToBeTranslated[property]) {
                        objectToBeTranslated[property] = getTranslationFromObject(objectToBeTranslated, property, objectToBeTranslated[property]);
                    }
                });

                _.each(objectToBeTranslated, function(value, key) {
                    if(_.isArray(value) && !_.contains("dataElements", key)){
                        _.each(value,function(object){
                            self.translateReferralLocations([object]);
                        });
                    }
                });
                return objectToBeTranslated;
            });
        };

        var translateObject = function (objectToBeTranslated) {

            _.each(TRANSLATABLE_OBJECT_PROPERTIES, function (property) {
                if (objectToBeTranslated[property]) {
                    objectToBeTranslated[property] = getTranslationFromObject(objectToBeTranslated, property, objectToBeTranslated[property]);
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
