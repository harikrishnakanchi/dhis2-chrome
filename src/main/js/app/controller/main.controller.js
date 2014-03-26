define(["ng-i18n"], function() {

    return function($rootScope, ngI18nResourceBundle) {
        ngI18nResourceBundle.get({
            locale: "en"
        }).success(function(resourceBundle) {
            $rootScope.resourceBundle = resourceBundle;
        });

    };
});