define([], function() {
    return function($rootScope) {
        this.logout = function() {
            $rootScope.isLoggedIn = false;
            $rootScope.currentUser = undefined;
        };
    };
});
