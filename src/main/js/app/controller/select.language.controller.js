define(["lodash"], function(_) {
    return function($scope, $rootScope, db, ngI18nResourceBundle) {
        $scope.changeLanguagePreference = function(language) {
            var getResourceBundle = function(locale, shouldFetchTranslations) {
                var fetchResourceBundleFromDb = function() {
                    var store = db.objectStore('translations');
                    var query = db.queryBuilder().$index('by_locale').$eq($rootScope.currentUser.locale).compile();
                    return store.each(query).then(function(translations) {
                        _.transform(translations, function(acc, translation) {
                            acc[translation.objectUid] = translation.value;
                        }, $rootScope.resourceBundle);
                    });
                };

                var getTranslationsForCurrentLocale = function() {
                    if (!$rootScope.currentUser.locale) $rootScope.currentUser.locale = "en";
                    fetchResourceBundleFromDb();
                };

                ngI18nResourceBundle.get({
                    "locale": locale
                }).then(function(data) {
                    $rootScope.resourceBundle = data.data;
                    if (shouldFetchTranslations) getTranslationsForCurrentLocale();
                });
            };

            $rootScope.currentUser.locale = language;

            return $rootScope.currentUser ? getResourceBundle($rootScope.currentUser.locale, true) : getResourceBundle("en", false);
        };
    };
});
