define(["lodash"], function(_) {
    return function($scope, $rootScope, $q, db, ngI18nResourceBundle, systemSettingRepository, translationsService) {
        $scope.changeLanguagePreference = function(language) {
            var getResourceBundle = function(locale, shouldFetchTranslations) {
                var fetchResourceBundleFromDb = function() {
                    var store = db.objectStore('translations');
                    var query = db.queryBuilder().$index('by_locale').$eq($rootScope.locale).compile();
                    return store.each(query).then(function(translations) {
                        _.transform(translations, function(acc, translation) {
                            if (translation.className === "DataElement" && translation.property !== "formName")
                                return;
                            acc[translation.objectId] = translation.value;
                        }, $rootScope.resourceBundle);
                    });
                };

                var updateLocaleInSystemSettings = function () {
                    return $q.when(systemSettingRepository.upsertLocale($rootScope.locale));
                };

                var getTranslationsForCurrentLocale = function() {
                    if (!$rootScope.locale) $rootScope.locale = "en";
                    fetchResourceBundleFromDb();
                    updateLocaleInSystemSettings();
                };

                ngI18nResourceBundle.get({
                    "locale": locale
                }).then(function(data) {
                    $rootScope.resourceBundle = data.data;
                    if (shouldFetchTranslations) getTranslationsForCurrentLocale();
                });
            };

            $rootScope.locale = language;
            translationsService.setLocale($rootScope.locale);

            return $rootScope ? getResourceBundle($rootScope.locale, true) : getResourceBundle("en", false);
        };
    };
});
