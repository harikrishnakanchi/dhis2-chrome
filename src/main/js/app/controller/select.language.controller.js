define(["lodash"], function(_) {
    return function($scope, $rootScope, translationsService) {
        $scope.changeLanguagePreference = function(locale) {
            $rootScope.locale = locale;
            translationsService.setLocale($rootScope.locale);
        };
    };
});
