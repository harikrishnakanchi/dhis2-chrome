define(["lodash"], function(_) {
    return function($scope, $rootScope, ngI18nResourceBundle, db) {

        $rootScope.$watch("currentUser.locale", function() {
            if ($rootScope.currentUser) {
                var getTranslationsForCurrentLocale = function() {

                    var data = {
                        'id': $rootScope.currentUser.id,
                        'locale': $scope.currentUser.locale
                    };
                    var preferenceStore = db.objectStore('userPreferences');
                    preferenceStore.upsert(data);

                    var store = db.objectStore('translations');
                    var query = db.queryBuilder().$index('by_locale').$eq($rootScope.currentUser.locale).compile();
                    store.each(query).then(function(translations) {
                        _.reduce(translations, function(acc, translation) {
                            acc[translation.objectUid] = translation.value;
                            return acc;
                        }, $rootScope.resourceBundle);
                    });
                };

                ngI18nResourceBundle.get({
                    locale: $scope.currentUser.locale
                }).then(function(data) {
                    $rootScope.resourceBundle = data.data;
                    getTranslationsForCurrentLocale();
                });
            }
        });

        $scope.logout = function() {
            $rootScope.isLoggedIn = false;
            $rootScope.currentUser = undefined;
        };
    };
});