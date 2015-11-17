define([], function() {
    return function($rootScope) {
        this.getBundle = function() {
            return $rootScope.resourceBundle;
        };
    };
});