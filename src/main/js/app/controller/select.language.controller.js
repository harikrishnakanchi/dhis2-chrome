define(["lodash"], function(_) {
    return function($scope, $rootScope) {
        $scope.changeLanguagePreference = function(locale) {
            $rootScope.setLocale(locale);
        };
    };
});
