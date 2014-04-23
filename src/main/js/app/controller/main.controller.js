define(["ng-i18n"], function() {

    return function($scope, $rootScope, ngI18nResourceBundle) {
        ngI18nResourceBundle.get({
            locale: "en"
        }).success(function(resourceBundle) {
            $rootScope.resourceBundle = resourceBundle;
        });

        $scope.logout = function() {
            $rootScope.isLoggedIn = false;
        };
    };
});