define(["lodash"], function(_) {
    var shouldRedirectToLogin = function(rootScope, location) {
        var accessingProductKeyPage = location.path() == '/productKeyPage';
        if(_.isUndefined(rootScope.isLoggedIn))
            return false;
        return !(rootScope.isLoggedIn || accessingProductKeyPage);
    };

    return {
        "shouldRedirectToLogin": shouldRedirectToLogin
    };
});

