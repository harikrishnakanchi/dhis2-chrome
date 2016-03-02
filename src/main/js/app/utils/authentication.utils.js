define(["lodash"], function(_) {
    var shouldRedirectToLogin = function(rootScope, newUrl) {
        var accessingProductKeyPage = newUrl.endsWith('#/productKeyPage');
        if(_.isUndefined(rootScope.isLoggedIn))
            return false;
        return (rootScope.isLoggedIn || accessingProductKeyPage) ? false : true;
    };

    return {
        "shouldRedirectToLogin": shouldRedirectToLogin
    };
});

