define(['lodash', 'platformUtils'], function (_, platformUtils) {
    return function ($rootScope, $location, systemSettingRepository, translationsService, packagedDataImporter) {

        $rootScope.setLocale = function (locale) {
            translationsService.setLocale(locale);
            $rootScope.locale = locale;
            $rootScope.layoutDirection = locale == 'ar' ? { 'direction': 'rtl' } : {};
        };

        $rootScope.hasRoles = function (allowedRoles) {
            if ($rootScope.currentUser === undefined)
                return false;

            return _.any($rootScope.currentUser.userCredentials.userRoles, function(userAuth) {
                return _.contains(allowedRoles, userAuth.name);
            });
        };

        $rootScope.startLoading = function () {
            $rootScope.loading = true;
        };

        $rootScope.stopLoading = function () {
            $rootScope.loading = false;
        };

        var redirectIfProductKeyNotSet = function() {
            return systemSettingRepository.isProductKeySet().then(function(productKeyIsSet) {
                if (productKeyIsSet) {
                    platformUtils.sendMessage('dbReady');
                    $location.path('/login');
                } else {
                    $location.path('/productKeyPage');
                }
            });
        };

        var run = function () {
            systemSettingRepository.getLocale().then($rootScope.setLocale);
            packagedDataImporter.run();
            systemSettingRepository.loadProductKey().finally(redirectIfProductKeyNotSet);
            platformUtils.init();
        };

        return {
            run: run
        };
    };
});
