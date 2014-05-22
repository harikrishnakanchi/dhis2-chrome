define(["ng-i18n"], function() {
    return function($scope, $rootScope, ngI18nResourceBundle) {
        $scope.locale = "en";

        $scope.$watch("locale", function() {
            ngI18nResourceBundle.get({
                locale: $scope.locale
            }).then(function(data) {
                $rootScope.resourceBundle = data.data;
            });
        });

        $scope.logout = function() {
            $rootScope.isLoggedIn = false;
            $rootScope.currentUser = undefined;
        };
    };
});