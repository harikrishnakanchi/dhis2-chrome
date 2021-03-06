define(['lodash', 'platformUtils'], function (_, platformUtils) {
    return function ($rootScope, $location, systemSettingRepository, translationsService, hustleMonitor) {

        $rootScope.setLocale = function (locale) {
            $rootScope.locale = locale;
            $rootScope.layoutDirection = locale == 'ar' ? { 'direction': 'rtl' } : {};
            return translationsService.setLocale(locale);
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

        var run = function () {
            systemSettingRepository.loadProductKey();
            hustleMonitor.checkHustleQueueCount();
            platformUtils.init();
        };

        return {
            run: run
        };
    };
});
