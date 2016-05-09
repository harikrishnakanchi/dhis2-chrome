define(["lodash"], function(_) {
    return function($scope, $rootScope, db, ngI18nResourceBundle) {
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

                var getTranslationsForCurrentLocale = function() {
                    if (!$rootScope.locale) $rootScope.locale = "en";
                    fetchResourceBundleFromDb();
                };

                ngI18nResourceBundle.get({
                    "locale": locale
                }).then(function(data) {
                    $rootScope.resourceBundle = data.data;
                    if (shouldFetchTranslations) getTranslationsForCurrentLocale();
                });
            };

            $rootScope.locale = language;

            return $rootScope ? getResourceBundle($rootScope.locale, true) : getResourceBundle("en", false);
        };
    };
});
