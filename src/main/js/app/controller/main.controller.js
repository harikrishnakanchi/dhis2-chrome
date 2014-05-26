define(["lodash"], function(_) {
    return function($scope, $rootScope, ngI18nResourceBundle, db, userPreferenceRepository) {

        $rootScope.$watch("currentUser.locale", function() {

            var getResourceBundle = function(locale, shouldFetchTranslations) {
                ngI18nResourceBundle.get({
                    "locale": locale
                }).then(function(data) {
                    $rootScope.resourceBundle = data.data;
                    if (shouldFetchTranslations) getTranslationsForCurrentLocale();
                });
            };

            if ($rootScope.currentUser) {
                var getTranslationsForCurrentLocale = function() {
                    if (!$rootScope.currentUser.locale) {
                        $rootScope.currentUser.locale = "en";
                    }
                    var userPreferences = {
                        'username': $rootScope.currentUser.userCredentials.username,
                        'locale': $scope.currentUser.locale,
                        'orgUnits': $scope.currentUser.organisationUnits
                    };
                    userPreferenceRepository.save(userPreferences);

                    var store = db.objectStore('translations');
                    var query = db.queryBuilder().$index('by_locale').$eq($rootScope.currentUser.locale).compile();
                    store.each(query).then(function(translations) {
                        _.reduce(translations, function(acc, translation) {
                            acc[translation.objectUid] = translation.value;
                            return acc;
                        }, $rootScope.resourceBundle);
                    });
                };

                getResourceBundle($scope.currentUser.locale, true);
            } else {
                getResourceBundle("en", false);
            }
        });

        $scope.logout = function() {
            $rootScope.isLoggedIn = false;
            $rootScope.currentUser = undefined;
        };
    };
});